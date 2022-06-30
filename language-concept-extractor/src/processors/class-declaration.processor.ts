import { AST_NODE_TYPES } from '@typescript-eslint/types';

import { ConceptMap, createConceptMap, mergeConceptMaps } from '../concept';
import { LCEClassDeclaration } from '../concepts/class-declaration.concept';
import { LCEDecorator } from '../concepts/decorator.concept';
import { LCEDependency } from '../concepts/dependency.concept';
import { LCEConstructorDeclaration, LCEGetterDeclaration, LCEMethodDeclaration, LCESetterDeclaration } from '../concepts/method-declaration.concept';
import { LCEPropertyDeclaration } from '../concepts/property-declaration.concept';
import { LCETypeDeclared } from '../concepts/type.concept';
import { ProcessingContext } from '../context';
import { ExecutionCondition } from '../execution-rule';
import { Processor } from '../processor';
import { getAndDeleteChildConcepts, getParentPropName } from '../processor.utils';
import { ClassDeclarationTraverser } from '../traversers/class-declaration.traverser';
import { DependencyResolutionProcessor } from './dependency-resolution.processor';
import { parseClassLikeBaseType, parseClassLikeTypeParameters } from './type.utils';

export class ClassDeclarationProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.ClassDeclaration],
        ({node}) => {
            // TODO: process class declarations in nested contexts
            return !!node.parent && (
                node.parent.type === AST_NODE_TYPES.ExportNamedDeclaration || 
                node.parent.type === AST_NODE_TYPES.ExportDefaultDeclaration ||
                node.parent.type === AST_NODE_TYPES.Program
            );
        },
    );

    public override preChildrenProcessing({localContexts, node}: ProcessingContext): void {
        if(node.type === AST_NODE_TYPES.ClassDeclaration && node.id) {
            DependencyResolutionProcessor.addNamespaceContext(localContexts, node.id.name);
        }
    }

    public override postChildrenProcessing({globalContext, localContexts, node}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.ClassDeclaration) {
            const className = node.id?.name ?? "";
            const fqn = DependencyResolutionProcessor.constructNamespaceFQN(localContexts);
            DependencyResolutionProcessor.registerDeclaration(localContexts, className, fqn);
            const classDecl = new LCEClassDeclaration(
                className,
                fqn,
                parseClassLikeTypeParameters(globalContext, node),
                getAndDeleteChildConcepts<LCETypeDeclared>(ClassDeclarationTraverser.EXTENDS_PROP, LCETypeDeclared.conceptId, childConcepts)[0],
                getAndDeleteChildConcepts(ClassDeclarationTraverser.IMPLEMENTS_PROP, LCETypeDeclared.conceptId, childConcepts),
                getAndDeleteChildConcepts<LCEConstructorDeclaration>(ClassDeclarationTraverser.MEMBERS_PROP, LCEConstructorDeclaration.conceptId, childConcepts)[0],
                getAndDeleteChildConcepts(ClassDeclarationTraverser.MEMBERS_PROP, LCEPropertyDeclaration.conceptId, childConcepts),
                getAndDeleteChildConcepts(ClassDeclarationTraverser.MEMBERS_PROP, LCEMethodDeclaration.conceptId, childConcepts),
                getAndDeleteChildConcepts(ClassDeclarationTraverser.MEMBERS_PROP, LCEGetterDeclaration.conceptId, childConcepts),
                getAndDeleteChildConcepts(ClassDeclarationTraverser.MEMBERS_PROP, LCESetterDeclaration.conceptId, childConcepts),
                getAndDeleteChildConcepts(ClassDeclarationTraverser.DECORATORS_PROP, LCEDecorator.conceptId, childConcepts),
                globalContext.sourceFilePath
            );
            return createConceptMap(LCEClassDeclaration.conceptId, classDecl);
        }
        return new Map();
    }
}

export class SuperClassDeclarationProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.Identifier],
        ({node, localContexts}) => !!node.parent && node.parent.type === AST_NODE_TYPES.ClassDeclaration &&
            getParentPropName(localContexts) === ClassDeclarationTraverser.EXTENDS_PROP,
    );

    public override postChildrenProcessing({node, localContexts, globalContext}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.Identifier && node.parent?.type === AST_NODE_TYPES.ClassDeclaration) {
            const superType = parseClassLikeBaseType(globalContext, node, node.parent.superTypeParameters?.params);
            if(superType){
                const typeConcept = createConceptMap(LCETypeDeclared.conceptId, superType);
                const dependencyConcept = new LCEDependency(
                    superType.fqn,
                    "declaration",
                    DependencyResolutionProcessor.constructNamespaceFQN(localContexts),
                    "declaration",
                    1
                );
                return mergeConceptMaps(createConceptMap(LCEDependency.conceptId, dependencyConcept), typeConcept);
            }
                
        }
        return new Map();
    }

}

export class ImplementsDeclarationProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.TSClassImplements],
        ({node, localContexts}) => !!node.parent && node.parent.type === AST_NODE_TYPES.ClassDeclaration &&
            getParentPropName(localContexts) === ClassDeclarationTraverser.IMPLEMENTS_PROP
    );

    public override postChildrenProcessing({node, localContexts, globalContext}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.TSClassImplements) {
            const implementsType = parseClassLikeBaseType(globalContext, node, node.typeParameters?.params);
            if(implementsType) {
                const typeConcept = createConceptMap(LCETypeDeclared.conceptId, implementsType);
                const dependencyConcept = new LCEDependency(
                    implementsType.fqn,
                    "declaration",
                    DependencyResolutionProcessor.constructNamespaceFQN(localContexts),
                    "declaration",
                    1
                );
                return mergeConceptMaps(createConceptMap(LCEDependency.conceptId, dependencyConcept), typeConcept);
            }
        }
        return new Map();
    }

}