import { AST_NODE_TYPES } from '@typescript-eslint/types';
import { FunctionDeclaration } from '@typescript-eslint/types/dist/generated/ast-spec';
import LCEFunctionDeclarationIndex from '../concept-indexes/function-declaration.index';
import { ConceptIndex } from '../concept-indexes';
import { LCEFunctionDeclaration } from '../concepts/function-declaration.concept';
import { LCEParameterDeclaration } from '../concepts/method-declaration.concept';
import { LCETypeParameterDeclaration } from '../concepts/type-parameter.concept';
import { BaseProcessor, SourceData } from '../processor';
import Utils from '../utils';
import { parseFunctionType } from './type.utils';


export default class FunctionDeclarationProcessor implements BaseProcessor {

    requiredConcepts: ConceptIndex[] = [];

    providedConcepts: ConceptIndex[] = [ConceptIndex.FUNCTION_DECLARATIONS];

    run(sourceData: SourceData, concepts: Map<ConceptIndex, any>): void {
        if(!concepts.has(ConceptIndex.FUNCTION_DECLARATIONS)) {
            concepts.set(ConceptIndex.FUNCTION_DECLARATIONS, new LCEFunctionDeclarationIndex())
        }

        const index: LCEFunctionDeclarationIndex = concepts.get(ConceptIndex.FUNCTION_DECLARATIONS);
        const decls = index.declarations;

        for(let statement of sourceData.ast.body) {
            if(statement.type === AST_NODE_TYPES.FunctionDeclaration) {
                // plain function declaration inside a TS file
                const [fqn, func] = this.processFunctionDeclaration(statement, sourceData);
                decls.set(fqn, func);
            } else if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration && 
                statement.declaration !== undefined && 
                statement.declaration?.type === AST_NODE_TYPES.FunctionDeclaration) {
                // function declaration that is directly exported
                const [fqn, func] = this.processFunctionDeclaration(statement.declaration, sourceData);
                decls.set(fqn, func);
            }
        }
    }

    /** converts a given ESTree function declaration into a function model object along with its FQN */
    private processFunctionDeclaration(functionDecl: FunctionDeclaration, sourceData: SourceData): [string, LCEFunctionDeclaration] {
        const fqn = Utils.getRelativeFQNForDeclaredTypeESNode(sourceData, functionDecl);

        const functionType = parseFunctionType(sourceData, functionDecl);

        const typeParameters: LCETypeParameterDeclaration[] = functionType.typeParameters;
        
        const returnType = functionType.returnType;

        // Function Parameter Composition
        const parameters: LCEParameterDeclaration[] = []; 
        for(let i = 0; i < functionType.parameters.length; i++) {
            const funcTypeParam = functionType.parameters[i];
            const esParamElem = functionDecl.params[i];
            parameters.push({
                index: funcTypeParam.index,
                name: funcTypeParam.name,
                type: funcTypeParam.type,
                optional: "optional" in esParamElem && !!esParamElem.optional,
                decorators: []
            });
        }

        return [fqn, {
            functionName: functionDecl.id!.name,
            typeParameters: typeParameters,
            returnType: returnType,
            parameters: parameters,
            sourceFilePath: sourceData.sourceFilePath
        }];
    }
}