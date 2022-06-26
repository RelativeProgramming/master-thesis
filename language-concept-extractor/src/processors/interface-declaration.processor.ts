import { AST_NODE_TYPES } from '@typescript-eslint/types';

import { ConceptMap, createConceptMap } from '../concept';
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
import { Utils } from '../utils';
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

    public override postChildrenProcessing({globalContext, localContexts, node}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.TSInterfaceDeclaration) {
            const fqn = Utils.getRelativeFQNForDeclaredTypeESNode(globalContext, node);
            const classDecl = new LCEInterfaceDeclaration(
                node.id!.name,
                fqn,
                parseClassLikeTypeParameters(globalContext, node),
                getAndDeleteChildConcepts(InterfaceDeclarationTraverser.EXTENDS_PROP, LCETypeDeclared.conceptId, childConcepts),
                getAndDeleteChildConcepts(ClassDeclarationTraverser.MEMBERS_PROP, LCEPropertyDeclaration.conceptId, childConcepts),
                getAndDeleteChildConcepts(ClassDeclarationTraverser.MEMBERS_PROP, LCEMethodDeclaration.conceptId, childConcepts),
                getAndDeleteChildConcepts(ClassDeclarationTraverser.MEMBERS_PROP, LCEGetterDeclaration.conceptId, childConcepts),
                getAndDeleteChildConcepts(ClassDeclarationTraverser.MEMBERS_PROP, LCESetterDeclaration.conceptId, childConcepts),
                globalContext.sourceFilePath
            );
            return createConceptMap(LCEInterfaceDeclaration.conceptId, classDecl);
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
            const superType = parseClassLikeBaseType(globalContext, node, node.parent.typeParameters?.params);
            if(superType)
                return createConceptMap(LCETypeDeclared.conceptId, superType);
        }
        return new Map();
    }

}