import { AST_NODE_TYPES } from '@typescript-eslint/types';
import { TSInterfaceDeclaration } from '@typescript-eslint/types/dist/generated/ast-spec';
import { Concept } from '../concepts';
import LCEInterfaceDeclarationIndex, { LCEInterfaceDeclaration } from '../concepts/interface-declaration.concept';
import { LCETypeParameterDeclaration } from '../concepts/type-parameter.concept';
import { BaseProcessor, SourceData } from '../processor';
import Utils from '../utils';
import { parseMembers } from './class-like-declaration.utils';
import { parseInterfaceTypeParameters } from './type.utils';


export default class InterfaceDeclarationProcessor implements BaseProcessor {

    requiredConcepts: Concept[] = [];

    providedConcepts: Concept[] = [Concept.INTERFACE_DECLARATIONS];

    run(sourceData: SourceData, concepts: Map<Concept, any>): void {
        if(!concepts.has(Concept.INTERFACE_DECLARATIONS)) {
            concepts.set(Concept.INTERFACE_DECLARATIONS, new LCEInterfaceDeclarationIndex())
        }

        const index: LCEInterfaceDeclarationIndex = concepts.get(Concept.INTERFACE_DECLARATIONS);
        const decls = index.declarations;

        for(let statement of sourceData.ast.body) {
            if(statement.type === AST_NODE_TYPES.TSInterfaceDeclaration) {
                // plain interface declaration inside a TS file
                const [fqn, interf] = this.processInterfaceDeclaration(statement, sourceData);
                decls.set(fqn, interf);
            } else if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration && 
                statement.declaration !== undefined && 
                statement.declaration?.type === AST_NODE_TYPES.TSInterfaceDeclaration) {
                // interface declaration that is directly exported
                const [fqn, interf] = this.processInterfaceDeclaration(statement.declaration, sourceData);
                decls.set(fqn, interf);
            }
        }
    }

    /** converts a given ESTree ClassDeclaration into a Class model object along with its FQN */
    private processInterfaceDeclaration(interfaceDecl: TSInterfaceDeclaration, sourceData: SourceData): [string, LCEInterfaceDeclaration] {
        const fqn = Utils.getRelativeFQNForESNode(sourceData, interfaceDecl);

        // Class Type Parameter Parsing
        const typeParameters: LCETypeParameterDeclaration[] = parseInterfaceTypeParameters(sourceData, interfaceDecl);

        const [methods, properties, getters, setters] = parseMembers(interfaceDecl, sourceData);
        
        return [fqn, {
            interfaceName: interfaceDecl.id!.name,
            typeParameters: typeParameters,
            properties: properties,
            methods: methods,
            getters: getters,
            setters: setters,
            sourceFilePath: sourceData.sourceFilePath
        }];
    }
}