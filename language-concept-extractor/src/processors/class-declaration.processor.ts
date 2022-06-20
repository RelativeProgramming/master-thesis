import { AST_NODE_TYPES } from '@typescript-eslint/types';

import { ConceptMap, createMapForConcept } from '../concept';
import { LCEClassDeclaration } from '../concepts/class-declaration.concept';
import { LCEDecorator } from '../concepts/decorator.concept';
import { LCEConstructorDeclaration, LCEGetterDeclaration, LCEMethodDeclaration, LCESetterDeclaration } from '../concepts/method-declaration.concept';
import { LCEPropertyDeclaration } from '../concepts/property-declaration.concept';
import { LCETypeDeclared } from '../concepts/type.concept';
import { ProcessingContext } from '../context';
import { ExecutionCondition } from '../execution-rule';
import { Processor } from '../processor';
import { getAndDeleteChildConcepts, getParentPropName } from '../processor.utils';
import { ClassDeclarationTraverser } from '../traversers/class-declaration.traverser';
import { Utils } from '../utils';
import { parseClassLikeBaseType, parseClassLikeTypeParameters } from './type.utils';

export class ClassDeclarationProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.ClassDeclaration],
        ({node}) => {
            // TODO: process class declarations in nested contexts
            return !!node.parent && (
                node.parent.type === AST_NODE_TYPES.ExportNamedDeclaration || 
                node.parent.type === AST_NODE_TYPES.Program
            );
        },
    );

    public override postChildrenProcessing({globalContext, localContexts, node}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.ClassDeclaration) {
            const fqn = Utils.getRelativeFQNForDeclaredTypeESNode(globalContext, node);
            const classDecl = new LCEClassDeclaration(
                node.id!.name,
                fqn,
                parseClassLikeTypeParameters(globalContext, node),
                getAndDeleteChildConcepts<LCETypeDeclared>(ClassDeclarationTraverser.SUPER_CLASS_PROP, LCETypeDeclared.conceptId, childConcepts)[0],
                getAndDeleteChildConcepts(ClassDeclarationTraverser.IMPLEMENTS_PROP, LCETypeDeclared.conceptId, childConcepts),
                getAndDeleteChildConcepts<LCEConstructorDeclaration>(ClassDeclarationTraverser.CLASS_ELEMENTS_PROP, LCEConstructorDeclaration.conceptId, childConcepts)[0],
                getAndDeleteChildConcepts(ClassDeclarationTraverser.CLASS_ELEMENTS_PROP, LCEPropertyDeclaration.conceptId, childConcepts),
                getAndDeleteChildConcepts(ClassDeclarationTraverser.CLASS_ELEMENTS_PROP, LCEMethodDeclaration.conceptId, childConcepts),
                getAndDeleteChildConcepts(ClassDeclarationTraverser.CLASS_ELEMENTS_PROP, LCEGetterDeclaration.conceptId, childConcepts),
                getAndDeleteChildConcepts(ClassDeclarationTraverser.CLASS_ELEMENTS_PROP, LCESetterDeclaration.conceptId, childConcepts),
                getAndDeleteChildConcepts(ClassDeclarationTraverser.DECORATORS_PROP, LCEDecorator.conceptId, childConcepts),
                globalContext.sourceFilePath
            );
            return createMapForConcept(getParentPropName(localContexts), LCEClassDeclaration.conceptId, classDecl);
        }
        return new Map();
    }
}

export class SuperClassDeclarationProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.Identifier],
        ({node, localContexts}) => !!node.parent && node.parent.type === AST_NODE_TYPES.ClassDeclaration &&
            getParentPropName(localContexts) === ClassDeclarationTraverser.SUPER_CLASS_PROP,
    );

    public override postChildrenProcessing({node, localContexts, globalContext}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.Identifier && node.parent?.type === AST_NODE_TYPES.ClassDeclaration) {
            const superType = parseClassLikeBaseType(globalContext, node, node.parent.superTypeParameters?.params);
            if(superType)
                return createMapForConcept(getParentPropName(localContexts), LCETypeDeclared.conceptId, superType);
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
            if(implementsType)
                return createMapForConcept(getParentPropName(localContexts), LCETypeDeclared.conceptId, implementsType);
        }
        return new Map();
    }

}