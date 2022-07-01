import { AST_NODE_TYPES } from '@typescript-eslint/types';

import { ConceptMap, singleEntryConceptMap, mergeConceptMaps } from '../concept';
import { LCEDependency } from '../concepts/dependency.concept';
import { LCEInterfaceDeclaration } from '../concepts/interface-declaration.concept';
import { LCEGetterDeclaration, LCEMethodDeclaration, LCESetterDeclaration } from '../concepts/method-declaration.concept';
import { LCEPropertyDeclaration } from '../concepts/property-declaration.concept';
import { LCETypeDeclared } from '../concepts/type.concept';
import { ProcessingContext } from '../context';
import { ExecutionCondition } from '../execution-rule';
import { Processor } from '../processor';
import { getAndDeleteChildConcepts, getParentPropName } from '../processor.utils';
import { ClassDeclarationTraverser } from '../traversers/class-declaration.traverser';
import { InterfaceDeclarationTraverser } from '../traversers/interface-declaration.traverser';
import { DependencyResolutionProcessor } from './dependency-resolution.processor';
import { parseClassLikeBaseType, parseClassLikeTypeParameters } from './type.utils';

export class InterfaceDeclarationProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.TSInterfaceDeclaration],
        ({node}) => {
            // TODO: process interface declarations in nested contexts
            return !!node.parent && (
                node.parent.type === AST_NODE_TYPES.ExportNamedDeclaration ||
                node.parent.type === AST_NODE_TYPES.ExportDefaultDeclaration || 
                node.parent.type === AST_NODE_TYPES.Program
            );
        },
    );

    public override preChildrenProcessing({localContexts, node}: ProcessingContext): void {
        if(node.type === AST_NODE_TYPES.TSInterfaceDeclaration) {
            DependencyResolutionProcessor.addNamespaceContext(localContexts, node.id.name);
            DependencyResolutionProcessor.createDependencyIndex(localContexts);
        }
    }

    public override postChildrenProcessing({globalContext, localContexts, node}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.TSInterfaceDeclaration) {
            const interfaceName = node.id.name;
            const fqn = DependencyResolutionProcessor.constructNamespaceFQN(localContexts);
            DependencyResolutionProcessor.registerDeclaration(localContexts, interfaceName, fqn);
            const classDecl = new LCEInterfaceDeclaration(
                interfaceName,
                fqn,
                parseClassLikeTypeParameters({globalContext, localContexts, node}, node),
                getAndDeleteChildConcepts(InterfaceDeclarationTraverser.EXTENDS_PROP, LCETypeDeclared.conceptId, childConcepts),
                getAndDeleteChildConcepts(ClassDeclarationTraverser.MEMBERS_PROP, LCEPropertyDeclaration.conceptId, childConcepts),
                getAndDeleteChildConcepts(ClassDeclarationTraverser.MEMBERS_PROP, LCEMethodDeclaration.conceptId, childConcepts),
                getAndDeleteChildConcepts(ClassDeclarationTraverser.MEMBERS_PROP, LCEGetterDeclaration.conceptId, childConcepts),
                getAndDeleteChildConcepts(ClassDeclarationTraverser.MEMBERS_PROP, LCESetterDeclaration.conceptId, childConcepts),
                globalContext.sourceFilePath
            );
            return mergeConceptMaps(singleEntryConceptMap(LCEInterfaceDeclaration.conceptId, classDecl),
                DependencyResolutionProcessor.getRegisteredDependencies(localContexts));
        }
        return new Map();
    }
}

export class SuperInterfaceDeclarationProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.Identifier],
        ({node, localContexts}) => !!node.parent && node.parent.type === AST_NODE_TYPES.TSInterfaceHeritage &&
            getParentPropName(localContexts) === ClassDeclarationTraverser.EXTENDS_PROP,
    );

    public override postChildrenProcessing({node, localContexts, globalContext}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.Identifier && node.parent?.type === AST_NODE_TYPES.TSInterfaceHeritage) {
            const superType = parseClassLikeBaseType({node, localContexts, globalContext}, node, node.parent.typeParameters?.params);
            if(superType) {
                const typeConcept = singleEntryConceptMap(LCETypeDeclared.conceptId, superType);
                const dependencyConcept = new LCEDependency(
                    superType.fqn,
                    "declaration",
                    DependencyResolutionProcessor.constructNamespaceFQN(localContexts),
                    "declaration",
                    1
                );
                return mergeConceptMaps(singleEntryConceptMap(LCEDependency.conceptId, dependencyConcept), typeConcept);
            }
        }
        return new Map();
    }
}