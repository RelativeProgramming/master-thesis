import { AST_NODE_TYPES } from '@typescript-eslint/types';
import { ClassDeclaration, ClassPropertyNameNonComputed, ExportSpecifier, MethodDefinitionNonComputedName } from '@typescript-eslint/types/dist/generated/ast-spec';
import { Concept } from '../concepts';
import ClassDeclarationIndex, { LCEClassDeclaration } from '../concepts/class-declaration.concept';
import { LCEDecorator } from '../concepts/decorator.concept';
import { LCEConstructorDeclaration, LCEGetterDeclaration, LCEMethodDeclaration, LCEParameterDeclaration, LCESetterDeclaration } from '../concepts/method-declaration.concept';
import { LCEPropertyDeclaration } from '../concepts/property-declaration.concept';
import { LCETypeParameterDeclaration } from '../concepts/type-parameter.concept';
import { LCETypeFunction } from '../concepts/type.concept';
import { BaseProcessor, SourceData } from '../processor';
import Utils from '../utils';
import { parseDecorators } from './decorator.utils';
import { parseClassMethodType, parseClassPropertyType, parseClassTypeParameters } from './type.utils';

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
    private processClassDeclaration(classDecl: ClassDeclaration, sourceData: SourceData): [string, LCEClassDeclaration] {
        const fqn = Utils.getRelativeFQNForESNode(sourceData, classDecl);

        // Class Decorator Parsing
        const decorators: LCEDecorator[] = parseDecorators(classDecl.decorators);

        // Class Type Parameter Parsing
        const typeParameters: LCETypeParameterDeclaration[] = parseClassTypeParameters(sourceData, classDecl);

        // Fields and Method Parsing
        const methods: LCEMethodDeclaration[] = [];
        const properties: LCEPropertyDeclaration[] = [];
        const getters: LCEGetterDeclaration[] = [];
        const setters: LCESetterDeclaration[] = [];
        let constr: LCEConstructorDeclaration | undefined;
        for(let classElement of classDecl.body.body) {
            if(classElement.type === AST_NODE_TYPES.PropertyDefinition && !classElement.computed) {
                // Non-Computed Property Parsing (omit computed properties)
                // TODO: handle static properties
                let [propertyName, jsPrivate] = this.processClassElementName(classElement.key);
                properties.push({
                    propertyName: propertyName,
                    optional: !!classElement.optional,
                    type: parseClassPropertyType(sourceData, classElement.key),
                    decorators: parseDecorators(classElement.decorators)
                });
            } else if (classElement.type === AST_NODE_TYPES.MethodDefinition && !classElement.computed) {
                // Non-Computed Method Parsing (omit computed methods)
                // TODO: handle static methods
                // TODO: handle overloads

                if(classElement.kind === "method") {
                    // method
                    let [methodName, jsPrivate] = this.processClassElementName(classElement.key)
                    const functionType = parseClassMethodType(sourceData, classDecl, classElement, methodName, jsPrivate);
                    
                    if(functionType) {
                        methods.push({
                            methodName: methodName,
                            returnType: functionType.returnType,
                            parameters: this.composeMethodParameters(functionType, classElement),
                            typeParameters: functionType.typeParameters,
                            decorators: parseDecorators(classElement.decorators)
                        });
                    }
                    
                } else if(classElement.kind === "constructor") {
                    // constructor
                    let [methodName, jsPrivate] = this.processClassElementName(classElement.key);
                    const functionType = parseClassMethodType(sourceData, classDecl, classElement, methodName, jsPrivate);
                    if(functionType) {
                        constr = {
                            parameters: this.composeMethodParameters(functionType, classElement)
                        };
                    }
                } else if(classElement.kind === "get") {
                    // getter
                    let [methodName, jsPrivate] = this.processClassElementName(classElement.key);
                    const functionType = parseClassMethodType(sourceData, classDecl, classElement, methodName, jsPrivate);
                    if(functionType) {
                        getters.push({
                            methodName: methodName,
                            returnType: functionType.returnType,
                            decorators: parseDecorators(classElement.decorators)
                        });
                    }
                } else {
                    // setter
                    let [methodName, jsPrivate] = this.processClassElementName(classElement.key);
                    const functionType = parseClassMethodType(sourceData, classDecl, classElement, methodName, jsPrivate);
                    if(functionType) {
                        setters.push({
                            methodName: methodName,
                            parameters: this.composeMethodParameters(functionType, classElement),
                            decorators: parseDecorators(classElement.decorators)
                        });
                    }
                }
            } else {
                // TODO: handle other class level declarations e.g. index signatures
            }
        }

        return [fqn, {
            className: classDecl.id!.name,
            typeParameters: typeParameters,
            constr: constr,
            properties: properties,
            methods: methods,
            getters: getters,
            setters: setters,
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

    /**
     * @param functionType parsed LCETypeFunction of the method
     * @param esClassElement ESTree class method node
     * @returns list of parameters for class method
     */
    private composeMethodParameters(functionType: LCETypeFunction, 
        esClassElement: MethodDefinitionNonComputedName): LCEParameterDeclaration[] {
        const parameters: LCEParameterDeclaration[] = [];
        for(let i = 0; i < functionType.parameters.length; i++) {
            const funcTypeParam = functionType.parameters[i];
            const esParamElem = esClassElement.value.params[i];
            parameters.push({
                index: funcTypeParam.index,
                name: funcTypeParam.name,
                type: funcTypeParam.type,
                decorators: parseDecorators(esParamElem.decorators)
            });
        }
        return parameters;
    }
}
