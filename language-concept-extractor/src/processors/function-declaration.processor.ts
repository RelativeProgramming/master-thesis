import { AST_NODE_TYPES } from '@typescript-eslint/types';

import { ConceptMap, createConceptMap } from '../concept';
import { LCEDecorator } from '../concepts/decorator.concept';
import { LCEFunctionDeclaration } from '../concepts/function-declaration.concept';
import { LCEParameterDeclaration } from '../concepts/method-declaration.concept';
import { LCETypeParameterDeclaration } from '../concepts/type-parameter.concept';
import { LCETypeFunction } from '../concepts/type.concept';
import { ProcessingContext } from '../context';
import { ExecutionCondition } from '../execution-rule';
import { Processor } from '../processor';
import { getAndDeleteChildConcepts, getParentPropIndex } from '../processor.utils';
import { IdentifierTraverser } from '../traversers/expression.traverser';
import { FunctionDeclarationTraverser } from '../traversers/function-declaration.traverser';
import { Utils } from '../utils';
import { DependencyResolutionProcessor } from './dependency-resolution.processor';
import { parseFunctionType } from './type.utils';


export class FunctionDeclarationProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.FunctionDeclaration],
        ({node}) => {
            // TODO: process function declarations in nested contexts
            return !!node.parent && (
                node.parent.type === AST_NODE_TYPES.ExportNamedDeclaration || 
                node.parent.type === AST_NODE_TYPES.ExportDefaultDeclaration ||
                node.parent.type === AST_NODE_TYPES.Program
            );
        },
    );

    public override preChildrenProcessing({node, localContexts, globalContext}: ProcessingContext): void {
        if(node.type === AST_NODE_TYPES.FunctionDeclaration) {
            const functionType = parseFunctionType(globalContext, node);
            if(functionType) {
                localContexts.currentContexts.set(FunctionParameterProcessor.FUNCTION_TYPE_CONTEXT_ID, functionType);
            }

            if(node.id) {
                DependencyResolutionProcessor.addNamespaceContext(localContexts, node.id.name);
            }
        }
    }

    public override postChildrenProcessing({node, localContexts, globalContext}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.FunctionDeclaration) {
            // TODO: handle overloads
            const functionType: LCETypeFunction | undefined = localContexts.currentContexts.get(FunctionParameterProcessor.FUNCTION_TYPE_CONTEXT_ID);
            if(functionType) {
                const fqn = DependencyResolutionProcessor.constructNamespaceFQN(localContexts);
                DependencyResolutionProcessor.registerDeclaration(localContexts, fqn);
                const typeParameters: LCETypeParameterDeclaration[] = functionType.typeParameters;
                const returnType = functionType.returnType;
                return createConceptMap(LCEFunctionDeclaration.conceptId, new LCEFunctionDeclaration(
                    node.id!.name,
                    fqn,
                    getAndDeleteChildConcepts(FunctionDeclarationTraverser.PARAMETERS_PROP, LCEParameterDeclaration.conceptId, childConcepts),
                    returnType,
                    typeParameters,
                    globalContext.sourceFilePath
                ));
            }
        }
        return new Map();
    }
}

export class FunctionParameterProcessor extends Processor {

    public static readonly FUNCTION_TYPE_CONTEXT_ID = "function-type";

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.Identifier], // TODO: add other parameter patterns
        ({localContexts}) => !!localContexts.parentContexts && localContexts.parentContexts.has(FunctionParameterProcessor.FUNCTION_TYPE_CONTEXT_ID)
    );

    public override postChildrenProcessing({node, localContexts, globalContext}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(localContexts.parentContexts) {
            const functionType: LCETypeFunction = localContexts.parentContexts.get(FunctionParameterProcessor.FUNCTION_TYPE_CONTEXT_ID);
            if(functionType) {
                const paramIndex: number = getParentPropIndex(localContexts)!;
                const funcTypeParam = functionType.parameters[paramIndex];
                
                if(node.type === AST_NODE_TYPES.Identifier) {
                    return createConceptMap(LCEParameterDeclaration.conceptId, new LCEParameterDeclaration(
                        funcTypeParam.index,
                        funcTypeParam.name,
                        funcTypeParam.type,
                        "optional" in node && !!node.optional,
                        getAndDeleteChildConcepts(IdentifierTraverser.DECORATORS_PROP, LCEDecorator.conceptId, childConcepts)
                    ));
                }
            }
        }

        return new Map();
    }

}