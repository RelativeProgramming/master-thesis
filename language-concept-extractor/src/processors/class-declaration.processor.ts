import { AST_NODE_TYPES } from '@typescript-eslint/types';
import { ClassDeclaration, ExportSpecifier } from '@typescript-eslint/types/dist/generated/ast-spec';
import { Concept } from '../concepts';
import ClassDeclarationIndex, { Class } from '../concepts/class-declaration.concept';
import { BaseProcessor, SourceData } from '../processor';
import Utils from '../utils';

export default class ClassDeclarationProcessor implements BaseProcessor {

    requiredConcepts: Concept[] = [];

    providedConcepts: Concept[] = [Concept.CLASS_DECLARATIONS];

    run(sourceData: SourceData, concepts: Map<Concept, any>): void {
        if(!concepts.has(Concept.CLASS_DECLARATIONS)) {
            concepts.set(Concept.CLASS_DECLARATIONS, new ClassDeclarationIndex())
        }
        const index: ClassDeclarationIndex = concepts.get(Concept.CLASS_DECLARATIONS);
        const decls = index.declarations;
        
        const astBody = sourceData.ast.body;

        // all named export specifiers are added during first run and checked later
        let exportSpecifiers: ExportSpecifier[] = [];

        for(let statement of astBody) {
            if(statement.type === AST_NODE_TYPES.ClassDeclaration) {
                // Default class declaration inside a TS file
                const [fqn, cl] = this.processClassDeclaration(statement, sourceData);
                decls.set(fqn, cl);
            } else if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration) {
                if(statement.declaration !== undefined && statement.declaration?.type === AST_NODE_TYPES.ClassDeclaration) {
                    // class declaration that is directly exported
                    const [fqn, cl] = this.processClassDeclaration(statement.declaration, sourceData);
                    cl.exported_name = cl.className;
                    decls.set(fqn, cl);
                } else if (statement.specifiers.length > 0 && statement.source === null) {
                    // class may ne exported separately via a named export (check after all declarations are scanned)
                    exportSpecifiers = exportSpecifiers.concat(statement.specifiers);
                }
            }
        }

        // Add separate exports
        for(let specifier of exportSpecifiers) {
            let fqn = Utils.getFQN(sourceData, specifier.local);
            if(decls.get(fqn))
                decls.get(fqn)!.exported_name = specifier.exported.name;
        }
    }

    /** converts a given ESTree ClassDeclaration into a Class model object */
    private processClassDeclaration(decl: ClassDeclaration, sourceData: SourceData): [string, Class] {
        const fqn = Utils.getFQN(sourceData, decl);

        // TODO: Add field and method parsing

        return [fqn, {
            className: decl.id!.name,
            fields: [],
            methods: [],
            sourceFilePath: sourceData.sourceFilePath,
            exported_name: undefined
        }];
    }
    

}