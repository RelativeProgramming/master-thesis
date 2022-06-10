import { AST_NODE_TYPES } from '@typescript-eslint/types';
import { TSInterfaceDeclaration } from '@typescript-eslint/types/dist/generated/ast-spec';
import LCEInterfaceDeclarationIndex from '../concept-indexes/interface-declaration.index';
import { Concept } from '../concepts';
import { LCEInterfaceDeclaration } from '../concepts/interface-declaration.concept';
import { LCETypeParameterDeclaration } from '../concepts/type-parameter.concept';
import { LCETypeDeclared } from '../concepts/type.concept';
import { BaseProcessor, SourceData } from '../processor';
import Utils from '../utils';
import { parseMembers } from './class-like-declaration.utils';
import { parseClassLikeBaseType, parseClassLikeTypeParameters } from './type.utils';


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
        const typeParameters: LCETypeParameterDeclaration[] = parseClassLikeTypeParameters(sourceData, interfaceDecl);

        // Parent Interfaces Parsing
        const extendsInterfaces = this.parseInterfaceInheritance(sourceData, interfaceDecl);

        // Properties and Method Parsing
        const [methods, properties, getters, setters] = parseMembers(interfaceDecl, sourceData);
        
        return [fqn, {
            interfaceName: interfaceDecl.id!.name,
            typeParameters: typeParameters,
            extendsInterfaces: extendsInterfaces,
            properties: properties,
            methods: methods,
            getters: getters,
            setters: setters,
            sourceFilePath: sourceData.sourceFilePath
        }];
    }

    /** returns a list of FQNs of all parent interfaces */
    private parseInterfaceInheritance(sourceData: SourceData, interfaceDecl: TSInterfaceDeclaration): LCETypeDeclared[] {
        const extendsInterfaces: LCETypeDeclared[] = [];

        const extendsElems = interfaceDecl.extends;
        if(extendsElems) {
            for(let extendsElem of extendsElems) {
                const extendsType = parseClassLikeBaseType(sourceData, extendsElem, extendsElem.typeParameters?.params);
                if(extendsType)
                    extendsInterfaces.push(extendsType);
            }
        }

        return extendsInterfaces;
    }
}