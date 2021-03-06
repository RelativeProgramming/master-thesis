import { AST_NODE_TYPES } from "@typescript-eslint/types";

import { ConceptMap, mergeConceptMaps, singleEntryConceptMap } from "../concept";
import { LCEDecorator } from "../concepts/decorator.concept";
import { LCEFunctionDeclaration } from "../concepts/function-declaration.concept";
import { LCEParameterDeclaration } from "../concepts/method-declaration.concept";
import { LCETypeParameterDeclaration } from "../concepts/type-parameter.concept";
import { LCETypeFunction } from "../concepts/type.concept";
import { ProcessingContext } from "../context";
import { ExecutionCondition } from "../execution-condition";
import { Processor } from "../processor";
import { getAndDeleteChildConcepts, getParentPropIndex } from "../processor.utils";
import { IdentifierTraverser } from "../traversers/expression.traverser";
import { FunctionTraverser } from "../traversers/function.traverser";
import { DependencyResolutionProcessor } from "./dependency-resolution.processor";
import { parseFunctionType } from "./type.utils";

export class FunctionDeclarationProcessor extends Processor {
    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.FunctionDeclaration, AST_NODE_TYPES.TSDeclareFunction],
        ({ node }) => {
            return (
                !!node.parent &&
                (node.parent.type === AST_NODE_TYPES.ExportNamedDeclaration ||
                    node.parent.type === AST_NODE_TYPES.ExportDefaultDeclaration ||
                    node.parent.type === AST_NODE_TYPES.Program)
            );
        }
    );

    public override preChildrenProcessing({ node, localContexts, globalContext }: ProcessingContext): void {
        if (node.type === AST_NODE_TYPES.FunctionDeclaration || node.type === AST_NODE_TYPES.TSDeclareFunction) {
            DependencyResolutionProcessor.createDependencyIndex(localContexts);

            const functionType = parseFunctionType({ globalContext, localContexts, node }, node);
            if (functionType) {
                localContexts.currentContexts.set(FunctionParameterProcessor.FUNCTION_TYPE_CONTEXT_ID, functionType);
                if (node.id) {
                    const fqn = DependencyResolutionProcessor.constructScopeFQN(localContexts);
                    DependencyResolutionProcessor.registerDeclaration(
                        localContexts,
                        node.id.name,
                        fqn,
                        localContexts.currentContexts.has(DependencyResolutionProcessor.FQN_SCOPE_CONTEXT)
                    );
                }
            }
        }
    }

    public override postChildrenProcessing({ node, localContexts, globalContext }: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if (node.type === AST_NODE_TYPES.FunctionDeclaration || node.type === AST_NODE_TYPES.TSDeclareFunction) {
            // TODO: handle overloads
            const functionType = localContexts.currentContexts.get(FunctionParameterProcessor.FUNCTION_TYPE_CONTEXT_ID) as
                | LCETypeFunction
                | undefined;
            if (functionType) {
                const functionName = node.id?.name ?? "";
                const fqn = DependencyResolutionProcessor.constructScopeFQN(localContexts);
                const typeParameters: LCETypeParameterDeclaration[] = functionType.typeParameters;
                const returnType = functionType.returnType;
                return mergeConceptMaps(
                    singleEntryConceptMap(
                        LCEFunctionDeclaration.conceptId,
                        new LCEFunctionDeclaration(
                            functionName,
                            fqn,
                            getAndDeleteChildConcepts(FunctionTraverser.PARAMETERS_PROP, LCEParameterDeclaration.conceptId, childConcepts),
                            returnType,
                            typeParameters,
                            globalContext.sourceFilePath
                        )
                    ),
                    DependencyResolutionProcessor.getRegisteredDependencies(localContexts)
                );
            }
        }
        return new Map();
    }
}

export class FunctionParameterProcessor extends Processor {
    public static readonly FUNCTION_TYPE_CONTEXT_ID = "function-type";

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.Identifier], // TODO: add other parameter patterns
        ({ localContexts }) => !!localContexts.parentContexts && localContexts.parentContexts.has(FunctionParameterProcessor.FUNCTION_TYPE_CONTEXT_ID)
    );

    public override postChildrenProcessing({ node, localContexts }: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if (localContexts.parentContexts) {
            const functionType = localContexts.parentContexts.get(FunctionParameterProcessor.FUNCTION_TYPE_CONTEXT_ID) as LCETypeFunction;
            if (functionType) {
                const paramIndex = getParentPropIndex(localContexts);
                if (paramIndex) {
                    const funcTypeParam = functionType.parameters[paramIndex];

                    // TODO: handle function overloads: funcTypeParam must always be defined!
                    if (funcTypeParam && node.type === AST_NODE_TYPES.Identifier) {
                        return singleEntryConceptMap(
                            LCEParameterDeclaration.conceptId,
                            new LCEParameterDeclaration(
                                funcTypeParam.index,
                                funcTypeParam.name,
                                funcTypeParam.type,
                                "optional" in node && !!node.optional,
                                getAndDeleteChildConcepts(IdentifierTraverser.DECORATORS_PROP, LCEDecorator.conceptId, childConcepts)
                            )
                        );
                    }
                }
            }
        }

        return new Map();
    }
}
