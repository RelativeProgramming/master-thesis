import { AST_NODE_TYPES } from '@typescript-eslint/types';
import { TSInterfaceDeclaration, FunctionDeclaration } from '@typescript-eslint/types/dist/generated/ast-spec';
import LCEFunctionDeclarationIndex from '../concept-indexes/function-declaration.index';
import LCEInterfaceDeclarationIndex from '../concept-indexes/interface-declaration.index';
import { Concept } from '../concepts';
import { LCEFunctionDeclaration } from '../concepts/function-declaration.concept';
import { LCEInterfaceDeclaration } from '../concepts/interface-declaration.concept';
import { LCEParameterDeclaration } from '../concepts/method-declaration.concept';
import { LCETypeParameterDeclaration } from '../concepts/type-parameter.concept';
import { LCETypeDeclared, LCETypeNotIdentified } from '../concepts/type.concept';
import { BaseProcessor, SourceData } from '../processor';
import Utils from '../utils';
import { parseMembers } from './class-like-declaration.utils';
import { parseClassLikeBaseType, parseClassLikeTypeParameters, parseFunctionType } from './type.utils';


export default class FunctionDeclarationProcessor implements BaseProcessor {

    requiredConcepts: Concept[] = [];

    providedConcepts: Concept[] = [Concept.FUNCTION_DECLARATIONS];

    run(sourceData: SourceData, concepts: Map<Concept, any>): void {
        if(!concepts.has(Concept.FUNCTION_DECLARATIONS)) {
            concepts.set(Concept.FUNCTION_DECLARATIONS, new LCEFunctionDeclarationIndex())
        }

        const index: LCEFunctionDeclarationIndex = concepts.get(Concept.FUNCTION_DECLARATIONS);
        const decls = index.declarations;

        for(let statement of sourceData.ast.body) {
            if(statement.type === AST_NODE_TYPES.FunctionDeclaration) {
                // plain interface declaration inside a TS file
                const [fqn, func] = this.processFunctionDeclaration(statement, sourceData);
                decls.set(fqn, func);
            } else if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration && 
                statement.declaration !== undefined && 
                statement.declaration?.type === AST_NODE_TYPES.FunctionDeclaration) {
                // interface declaration that is directly exported
                const [fqn, func] = this.processFunctionDeclaration(statement.declaration, sourceData);
                decls.set(fqn, func);
            }
        }
    }

    /** converts a given ESTree function declaration into a function model object along with its FQN */
    private processFunctionDeclaration(functionDecl: FunctionDeclaration, sourceData: SourceData): [string, LCEFunctionDeclaration] {
        const fqn = Utils.getRelativeFQNForESNode(sourceData, functionDecl);

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