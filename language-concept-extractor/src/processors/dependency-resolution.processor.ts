import { AST_NODE_TYPES } from '@typescript-eslint/types';

import { ConceptMap, createConceptMap, getAndCastConcepts, LCENamedConcept, mergeConceptMaps } from '../concept';
import { LCEDependency } from '../concepts/dependency.concept';
import { LocalContexts, ProcessingContext } from '../context';
import { ExecutionCondition } from '../execution-rule';
import { Processor } from '../processor';
import { getAndDeleteChildConcepts, getChildConcepts } from '../processor.utils';
import { ProgramTraverser } from '../traversers/program.traverser';


/**
 * Contains FQNs of all global and local declarations made within the current file.
 */
 export type DeclarationIndex = Set<string>;

/** 
 * List of references that need to be resolved.
 * 
 * [FQN namespace stack, local identifier of reference, reference object]
 */
export type FQNResolverContext = Array<[string[], string, LCENamedConcept]>;


/**
 * Manages FQN contexts, provides index for registering declarations and resolves FQN references.
 */
export class DependencyResolutionProcessor extends Processor {

    public static readonly DECLARATION_INDEX_CONTEXT = "declaration-index";
    public static readonly FQN_CONTEXT = 'fqn-namespace';
    public static readonly FQN_RESOLVER_CONTEXT = 'fqn-resolver';

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.Program],
        () => true
    );

    public override preChildrenProcessing({localContexts, globalContext}: ProcessingContext): void {
        localContexts.currentContexts.set(DependencyResolutionProcessor.DECLARATION_INDEX_CONTEXT, new Set());
        localContexts.currentContexts.set(DependencyResolutionProcessor.FQN_CONTEXT, '"'+globalContext.sourceFilePathRelative+'"');
        localContexts.currentContexts.set(DependencyResolutionProcessor.FQN_RESOLVER_CONTEXT, []);
    }

    public override postChildrenProcessing({node, localContexts}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        const declIndex: DeclarationIndex = localContexts.getNextContext(DependencyResolutionProcessor.DECLARATION_INDEX_CONTEXT)![0];
        const resolutionList: FQNResolverContext = localContexts.getNextContext(DependencyResolutionProcessor.FQN_RESOLVER_CONTEXT)![0];

        // resolve FQNs
        for(let [namespaces, identifier, concept] of resolutionList) {
            for(let i = namespaces.length; i > 0; i--) {
                const testFqn = namespaces.slice(0, i).join(".") + "." + identifier;
                if(declIndex.has(testFqn)) {
                    concept.fqn = testFqn;
                    break;
                }
            }
        }

        // merge dependencies
        const dependencies = getAndDeleteChildConcepts<LCEDependency>(ProgramTraverser.PROGRAM_BODY_PROP, LCEDependency.conceptId, childConcepts);
        const depIndex: Map<string, Map<string, LCEDependency>> = new Map();
        for(let dep of dependencies) {
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
                concepts.push(createConceptMap(LCEDependency.conceptId, val))
            });
        });

        return mergeConceptMaps(...concepts);
    }

    public static constructFQNPrefix(localContexts: LocalContexts): string {
        let result = "";
        for(let context of localContexts.contexts) {
            const name: string | undefined = context.get(DependencyResolutionProcessor.FQN_CONTEXT);
            if(name) {
                result += name + ".";
            }
        }
        return result;
    }

    public static constructNamespaceFQN(localContexts: LocalContexts): string {
        let result = this.constructFQNPrefix(localContexts);
        return result.substring(0, result.length - 1);
    }

    public static registerDeclaration(localContexts: LocalContexts, fqn: string): void {
        const declIndex: DeclarationIndex = localContexts.getNextContext(DependencyResolutionProcessor.DECLARATION_INDEX_CONTEXT)![0];
        declIndex.add(fqn);
    }

    public static scheduleFqnResolution(localContexts: LocalContexts, identifier: string, concept: LCENamedConcept): void {
        const namespaces: string[] = [];
        for(let context of localContexts.contexts) {
            const name: string | undefined = context.get(DependencyResolutionProcessor.FQN_CONTEXT);
            if(name) {
                namespaces.push(name);
            }
        }
        const resolutionList: FQNResolverContext = localContexts.getNextContext(DependencyResolutionProcessor.FQN_RESOLVER_CONTEXT)![0];
        resolutionList.push([namespaces, identifier, concept]);
    }

    public static addNamespaceContext(localContexts: LocalContexts, namespace: string): void {
        localContexts.currentContexts.set(DependencyResolutionProcessor.FQN_CONTEXT, namespace);
    }
    
}