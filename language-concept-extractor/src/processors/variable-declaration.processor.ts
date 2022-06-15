import { AST_NODE_TYPES } from '@typescript-eslint/types';
import { VariableDeclaration } from '@typescript-eslint/types/dist/generated/ast-spec';
import { ConceptIndex } from '../concept-indexes';
import { BaseProcessor, SourceData } from '../processor';
import Utils from '../utils';
import LCEVariableDeclarationIndex from '../concept-indexes/variable-declaration.index';
import { LCEVariableDeclaration } from '../concepts/variable-declaration.concept';
import { parseVariableType } from './type.utils';
import { parseValue } from './value.utils';


export default class VariableDeclarationProcessor implements BaseProcessor {

    requiredConcepts: ConceptIndex[] = [];

    providedConcepts: ConceptIndex[] = [ConceptIndex.VARIABLE_DECLARATIONS];

    run(sourceData: SourceData, concepts: Map<ConceptIndex, any>): void {
        if(!concepts.has(ConceptIndex.VARIABLE_DECLARATIONS)) {
            concepts.set(ConceptIndex.VARIABLE_DECLARATIONS, new LCEVariableDeclarationIndex())
        }

        const index: LCEVariableDeclarationIndex = concepts.get(ConceptIndex.VARIABLE_DECLARATIONS);
        const decls = index.declarations;

        let processedDecls: [string, LCEVariableDeclaration][] = [];

        for(let statement of sourceData.ast.body) {
            if(statement.type === AST_NODE_TYPES.VariableDeclaration) {
                // plain variable declaration inside a TS file
                processedDecls = processedDecls.concat(this.processVariableDeclaration(statement, sourceData));
            } else if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration && 
                statement.declaration !== undefined && 
                statement.declaration?.type === AST_NODE_TYPES.VariableDeclaration) {
                // variable declaration that is directly exported
                processedDecls = processedDecls.concat(this.processVariableDeclaration(statement.declaration, sourceData));
            }
        }

        processedDecls.forEach(([fqn, decl]) => decls.set(fqn, decl));
    }

    /** converts a given ESTree variable declaration into a variable declaration model object along with its FQN */
    private processVariableDeclaration(varDecl: VariableDeclaration, sourceData: SourceData): [string, LCEVariableDeclaration][] {
        const result: [string, LCEVariableDeclaration][] = []
        
        for(let varDeclarator of varDecl.declarations) {
            const fqn = Utils.getRelativeFQNForDeclaredTypeESNode(sourceData, varDeclarator.id);
            let varName = fqn;
            if("name" in varDeclarator.id) {
                // variable declarator id is an Identifier
                varName = varDeclarator.id.name;
            }
            // TODO: handle destructuring variable name declaration

            const type = parseVariableType(sourceData, varDeclarator, varName);

            const value = varDeclarator.init ? parseValue(sourceData, varDeclarator.init, varName) : undefined;
            
            result.push([fqn, {
                variableName: varName,
                kind: varDecl.kind,
                type: type,
                initValue: value,
                sourceFilePath: sourceData.sourceFilePath
            }])
        }
        


        return result;
    }
}