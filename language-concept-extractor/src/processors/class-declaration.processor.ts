import { AST_NODE_TYPES } from '@typescript-eslint/types';
import { ClassDeclaration, ClassPropertyNameNonComputed, ExportSpecifier } from '@typescript-eslint/types/dist/generated/ast-spec';
import { Concept } from '../concepts';
import ClassDeclarationIndex, { LCEClassDeclaration } from '../concepts/class-declaration.concept';
import { LCEDecorator } from '../concepts/decorator.concept';
import { LCEMethodDeclaration } from '../concepts/method-declaration.concept';
import { LCEPropertyDeclaration } from '../concepts/property-declaration.concept';
import { BaseProcessor, SourceData } from '../processor';
import Utils from '../utils';
import { parseDecorators } from './decorator.utils';

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
            } else if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration && 
                statement.declaration !== undefined && 
                statement.declaration?.type === AST_NODE_TYPES.ClassDeclaration) {
                // class declaration that is directly exported
                const [fqn, cl] = this.processClassDeclaration(statement.declaration, sourceData);
                decls.set(fqn, cl);
            }
        }
    }

    /** converts a given ESTree ClassDeclaration into a Class model object */
    private processClassDeclaration(decl: ClassDeclaration, sourceData: SourceData): [string, LCEClassDeclaration] {
        const fqn = Utils.getFQN(sourceData, decl);

        // Class Decorator Parsing
        const decorators: LCEDecorator[] = parseDecorators(decl.decorators);
        // Fields and Method Parsing
        const methods: LCEMethodDeclaration[] = [];
        const properties: LCEPropertyDeclaration[] = [];
        for(let classElement of decl.body.body) {
            if(classElement.type === AST_NODE_TYPES.PropertyDefinition && !classElement.computed) {
                // Non-Computed Property Parsing (omit computed properties)
                let [propertyName, jsPrivate] = this.processClassElementName(classElement.key);

                properties.push({
                    decorators: parseDecorators(classElement.decorators),
                    propertyName: propertyName,
                    optional: !!classElement.optional
                });
            } else if (classElement.type === AST_NODE_TYPES.MethodDefinition && !classElement.computed) {
                // Non-Computed Method Parsing (omit computed methods)
                let [methodName, jsPrivate] = this.processClassElementName(classElement.key);

                methods.push({
                    methodName: methodName,
                    decorators: parseDecorators(classElement.decorators)
                });
            } else {
                // TODO: handle other class level declarations
            }
        }

        return [fqn, {
            className: decl.id!.name,
            properties: properties,
            methods: methods,
            decorators: decorators,
            sourceFilePath: sourceData.sourceFilePath
        }];
    }

    /** 
     * Returns the field or method name for a given non-computed class element.
     * Also returns if the element was declared private by using a #
     * */
    private processClassElementName(name: ClassPropertyNameNonComputed): [string, boolean] {
        let result = "";
        let jsPrivate = false;

        if(name.type === AST_NODE_TYPES.Identifier) {
            result = name.name;
        } else if(name.type === AST_NODE_TYPES.Literal) {
            result = name.value+"";
        } else {
            result = name.name;
            jsPrivate = true;
        }

        return [result, jsPrivate];
    }
}
