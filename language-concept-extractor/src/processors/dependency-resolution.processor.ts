import { AST_NODE_TYPES } from '@typescript-eslint/types';

import { ConceptMap, singleEntryConceptMap, LCENamedConcept, mergeConceptMaps, createConceptMap } from '../concept';
import { LCEDependency } from '../concepts/dependency.concept';
import { LocalContexts, ProcessingContext } from '../context';
import { ExecutionCondition } from '../execution-condition';
import { PathUtils } from '../path.utils';
import { Processor } from '../processor';
import { getAndDeleteChildConcepts } from '../processor.utils';
import { ProgramTraverser } from '../traversers/program.traverser';


/**
 * Maps namespace identifier and local name to FQN for all global and local declarations made within the current file.
 */
 export type DeclarationIndex = Map<string, Map<string, string>>;

/** 
 * List of references that need to be resolved.
 * 
 * [FQN namespace stack, local identifier of reference, reference object]
 */
export type FQNResolverContext = Array<[string[], string, LCENamedConcept]>;

export interface FQNScope {
    identifier: string;
    internalScopeId: number;
}


/**
 * Manages FQN contexts, provides index for registering declarations and resolves FQN references.
 */
export class DependencyResolutionProcessor extends Processor {

    /** key to the dependency index, used for registering all declarations made within a module (`DeclarationIndex`) */
    public static readonly DECLARATION_INDEX_CONTEXT = "declaration-index";

    /** key to the current scope object, used to introduce new FQN scoping levels (`FQNScope`) */
    public static readonly FQN_SCOPE_CONTEXT = 'fqn-scope';

    /** key to the FQN resolver index, used to schedule FQN resolutions (`FQNResolverContext`) */
    public static readonly FQN_RESOLVER_CONTEXT = 'fqn-resolver';

    /** key to the FQN of the declaration that any newly discovered dependencies are added to (`string`) */
    public static readonly DEPENDENCY_SOURCE_FQN_CONTEXT = 'dependency-fqn';

    /** key to the dependency index of the current dependency fqn (`Array<LCEDependency>`) */
    public static readonly DEPENDENCY_INDEX_CONTEXT = 'dependency-index';


    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.Program],
        () => true
    );

    public override preChildrenProcessing({localContexts, globalContext}: ProcessingContext): void {
        localContexts.currentContexts.set(DependencyResolutionProcessor.DECLARATION_INDEX_CONTEXT, new Map());
        localContexts.currentContexts.set(DependencyResolutionProcessor.FQN_SCOPE_CONTEXT, {
            identifier: PathUtils.toFQN(globalContext.sourceFilePath),
            internalScopeId: 0
        } as FQNScope);
        localContexts.currentContexts.set(DependencyResolutionProcessor.FQN_RESOLVER_CONTEXT, []);
        localContexts.currentContexts.set(DependencyResolutionProcessor.DEPENDENCY_SOURCE_FQN_CONTEXT, PathUtils.toFQN(globalContext.sourceFilePath));
        localContexts.currentContexts.set(DependencyResolutionProcessor.DEPENDENCY_INDEX_CONTEXT, []);
    }

    public override postChildrenProcessing({node, localContexts}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        const declIndex: DeclarationIndex = localContexts.getNextContext(DependencyResolutionProcessor.DECLARATION_INDEX_CONTEXT)![0];
        const resolutionList: FQNResolverContext = localContexts.getNextContext(DependencyResolutionProcessor.FQN_RESOLVER_CONTEXT)![0];

        // resolve FQNs
        for(let [namespaces, identifier, concept] of resolutionList) {
            for(let i = namespaces.length; i > 0; i--) {
                const testNamespace = namespaces.slice(0, i).join(".");
                if(declIndex.has(testNamespace) && declIndex.get(testNamespace)!.has(identifier)) {
                    concept.fqn = declIndex.get(testNamespace)!.get(identifier)!;
                    break;
                }
            }
        }

        // merge dependencies
        const dependencies = getAndDeleteChildConcepts<LCEDependency>(ProgramTraverser.PROGRAM_BODY_PROP, LCEDependency.conceptId, childConcepts)
            .concat(localContexts.currentContexts.get(DependencyResolutionProcessor.DEPENDENCY_INDEX_CONTEXT)!);
        const depIndex: Map<string, Map<string, LCEDependency>> = new Map();
        for(let dep of dependencies) {
            if(!dep.fqn.startsWith('"') || dep.fqn.startsWith(dep.sourceFQN))
                continue; // skip invalid FQNs and dependencies on own scope
            
            if(!depIndex.has(dep.sourceFQN)) {
                depIndex.set(dep.sourceFQN, new Map([[dep.fqn, dep]]));
            } else if(!depIndex.get(dep.sourceFQN)!.has(dep.fqn)) {
                depIndex.get(dep.sourceFQN)!.set(dep.fqn, dep);
            } else {
                depIndex.get(dep.sourceFQN)!.get(dep.fqn)!.cardinality += dep.cardinality;
            }
        }

        // return merged dependencies
        const concepts: ConceptMap[] = [];
        depIndex.forEach(valMap => {
            valMap.forEach(val => {
                concepts.push(singleEntryConceptMap(LCEDependency.conceptId, val))
            });
        });

        return mergeConceptMaps(...concepts);
    }

    public static constructFQNPrefix(localContexts: LocalContexts, skipLastScope = false): string {
        let result = "";
        for(let i = 0; i < localContexts.contexts.length - (skipLastScope ? 1 : 0); i++) {
            let context = localContexts.contexts[i];
            const name: string | undefined = (context.get(DependencyResolutionProcessor.FQN_SCOPE_CONTEXT) as FQNScope)?.identifier;
            if(name) {
                result += name + ".";
            }
        }
        return result;
    }

    public static constructScopeFQN(localContexts: LocalContexts, skipLastScope = false): string {
        let result = this.constructFQNPrefix(localContexts, skipLastScope);
        return result.substring(0, result.length - 1);
    }

    /**
     * @param localName local name under which the declaration is used
     * @param fqn fully qualified name of the declaration
     * @param insideScopeDeclaration specifies whether the declaration is registered while traversing its own scope
     */
    public static registerDeclaration(localContexts: LocalContexts, localName: string, fqn: string, insideScopeDeclaration = false): void {
        const declIndex: DeclarationIndex = localContexts.getNextContext(DependencyResolutionProcessor.DECLARATION_INDEX_CONTEXT)![0];
        const namespace = this.constructScopeFQN(localContexts, insideScopeDeclaration);
        if(!declIndex.has(namespace))
            declIndex.set(namespace, new Map());
        declIndex.get(namespace)!.set(localName, fqn);
    }

    public static scheduleFqnResolution(localContexts: LocalContexts, localName: string, concept: LCENamedConcept): void {
        const namespaces: string[] = [];
        for(let context of localContexts.contexts) {
            const name: string | undefined = (context.get(DependencyResolutionProcessor.FQN_SCOPE_CONTEXT) as FQNScope)?.identifier;
            if(name) {
                namespaces.push(name);
            }
        }
        const resolutionList: FQNResolverContext = localContexts.getNextContext(DependencyResolutionProcessor.FQN_RESOLVER_CONTEXT)![0];
        resolutionList.push([namespaces, localName, concept]);
    }

    public static addScopeContext(localContexts: LocalContexts, scopeIdentifier?: string): void {
        if(!scopeIdentifier) {
            scopeIdentifier = (localContexts.getNextContext(DependencyResolutionProcessor.FQN_SCOPE_CONTEXT)![0] as FQNScope).internalScopeId.toString();
            (localContexts.getNextContext(DependencyResolutionProcessor.FQN_SCOPE_CONTEXT)![0] as FQNScope).internalScopeId++;
        }
        localContexts.currentContexts.set(DependencyResolutionProcessor.FQN_SCOPE_CONTEXT, {
            identifier: scopeIdentifier,
            internalScopeId: 0
        } as FQNScope);
    }

    /**
     * creates a new dependency index for the current namespace FQN
     * @param fqn use this to specify different FQN than the one of the current namespace
     */
    public static createDependencyIndex(localContexts: LocalContexts, fqn?: string): void {
        localContexts.currentContexts.set(DependencyResolutionProcessor.DEPENDENCY_SOURCE_FQN_CONTEXT, fqn ?? DependencyResolutionProcessor.constructScopeFQN(localContexts));
        localContexts.currentContexts.set(DependencyResolutionProcessor.DEPENDENCY_INDEX_CONTEXT, []);
    }

    /** registers declaration dependency (also automatically resolves FQN, disable via `resolveFQN` parameter) */
    public static registerDependency(localContexts: LocalContexts, depFQN: string, resolveFQN: boolean = true): void {
        const depIndex: LCEDependency[] = localContexts.getNextContext(DependencyResolutionProcessor.DEPENDENCY_INDEX_CONTEXT)![0];
        const depSourceFQN: string = localContexts.getNextContext(DependencyResolutionProcessor.DEPENDENCY_SOURCE_FQN_CONTEXT)![0];
        const dep = new LCEDependency(
            depFQN,
            "declaration",
            depSourceFQN,
            PathUtils.isFQNModule(depSourceFQN) ? "module" : "declaration",
            1
        );
        if(resolveFQN) {
            this.scheduleFqnResolution(localContexts, depFQN, dep);
        }
        depIndex.push(dep);
    }

    /** return all registered dependencies of the current dependency index */
    public static getRegisteredDependencies(localContexts: LocalContexts): ConceptMap {
        return createConceptMap(LCEDependency.conceptId, localContexts.getNextContext(DependencyResolutionProcessor.DEPENDENCY_INDEX_CONTEXT)![0]);
    }
    
}