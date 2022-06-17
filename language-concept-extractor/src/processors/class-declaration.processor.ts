import { AST_NODE_TYPES } from '@typescript-eslint/types';

import { ConceptMap, createMapForConcept } from '../concept';
import { LCEClassDeclaration } from '../concepts/class-declaration.concept';
import { LCEDecorator } from '../concepts/decorator.concept';
import { ProcessingContext } from '../context';
import { ExecutionCondition } from '../execution-rule';
import { TRAVERSERS } from '../features';
import { Processor } from '../processor';
import { getAndDeleteChildConcepts, getParentPropName } from '../processor.utils';
import { ClassDeclarationTraverser } from '../traversers/class-declaration.traverser';
import { parseClassLikeTypeParameters } from './type.utils';

export class ClassDeclarationProcessor extends Processor {

    public static readonly CONTEXT_ID = "class-declaration";

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.ClassDeclaration],
        (curNode) => {
            // TODO: process classes in nested contexts
            return !!curNode.parent && (
                curNode.parent.type === AST_NODE_TYPES.ExportNamedDeclaration || 
                curNode.parent.type === AST_NODE_TYPES.Program
            );
        },
        (globalConText, localContexts) => true
    );

    public override preChildrenProcessing({globalContext, localContexts, node}: ProcessingContext): void {
        localContexts.currentContexts.set(ClassDeclarationProcessor.CONTEXT_ID, new Map<string, any>([
            // use to set any class declaration related local context
        ]));
    }

    public override postChildrenProcessing({globalContext, localContexts, node}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.ClassDeclaration) {
            // TODO: implement child processors

            const classDecl = new LCEClassDeclaration(
                node.id!.name,
                parseClassLikeTypeParameters(globalContext, node),
                undefined,
                [],
                undefined,
                [],
                [],
                [],
                [],
                getAndDeleteChildConcepts(ClassDeclarationTraverser.DECORATORS_PROP ,LCEDecorator.conceptId, childConcepts),
                globalContext.sourceFilePath
            );
            return createMapForConcept(getParentPropName(localContexts), LCEClassDeclaration.conceptId, classDecl);
        }
        return new Map();
    }
}