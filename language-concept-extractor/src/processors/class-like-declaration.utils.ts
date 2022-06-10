import { AST_NODE_TYPES } from '@typescript-eslint/types';
import { ClassDeclaration, TSInterfaceDeclaration, ClassPropertyNameNonComputed, PropertyNameNonComputed, MethodDefinitionNonComputedName, TSMethodSignatureNonComputedName } from '@typescript-eslint/types/dist/generated/ast-spec';
import { LCEMethodDeclaration, LCEGetterDeclaration, LCESetterDeclaration, LCEConstructorDeclaration, LCEParameterDeclaration } from '../concepts/method-declaration.concept';
import { LCEPropertyDeclaration } from '../concepts/property-declaration.concept';
import { LCETypeFunction } from '../concepts/type.concept';
import { SourceData } from '../processor';
import { parseDecorators } from './decorator.utils';
import { parseClassPropertyType as parsePropertyType, parseMethodType } from './type.utils';

/**
 * Extracts member information from class or interface declaration
 * @param decl EStree node object of class or interface declaration
 * @returns LCE model objects for all declared methods, properties, getters, setters and constructor
 */
export function parseMembers(decl: ClassDeclaration | TSInterfaceDeclaration, sourceData: SourceData) 
: [LCEMethodDeclaration[], LCEPropertyDeclaration[], LCEGetterDeclaration[], LCESetterDeclaration[], LCEConstructorDeclaration | undefined] {
    // Fields and Method Parsing
    const methods: LCEMethodDeclaration[] = [];
    const properties: LCEPropertyDeclaration[] = [];
    const getters: LCEGetterDeclaration[] = [];
    const setters: LCESetterDeclaration[] = [];
    let constr: LCEConstructorDeclaration | undefined;
    for(let element of decl.body.body) {
        if((element.type === AST_NODE_TYPES.PropertyDefinition || element.type === AST_NODE_TYPES.TSPropertySignature) && !element.computed) {
            // Non-Computed Property Parsing (omit computed properties)
            // TODO: handle static properties
            let [propertyName, jsPrivate] = processMemberName(element.key);
            properties.push({
                propertyName: propertyName,
                optional: !!element.optional,
                type: parsePropertyType(sourceData, element.key),
                decorators: "decorators" in element ? parseDecorators(element.decorators) : [],
                visibility: jsPrivate ? "js_private" : element.accessibility ?? "public",
                readonly: !!element.readonly,
                override: "override" in element ? element.override : undefined
            });
        } else if ((element.type === AST_NODE_TYPES.MethodDefinition || element.type === AST_NODE_TYPES.TSMethodSignature) && !element.computed) {
            // Non-Computed Method Parsing (omit computed methods)
            // TODO: handle static methods
            // TODO: handle overloads
            const [methodName, jsPrivate] = processMemberName(element.key)
            const visibility = jsPrivate ? "js_private" : element.accessibility ?? "public";
            if(methodName == "comp2Func") 
                methodName
            if(element.kind === "method") {
                // method
                const functionType = parseMethodType(sourceData, decl, element, methodName, jsPrivate);
                
                if(functionType) {
                    methods.push({
                        methodName: methodName,
                        returnType: functionType.returnType,
                        parameters: composeMethodParameters(functionType, element),
                        typeParameters: functionType.typeParameters,
                        decorators: "decorators" in element ? parseDecorators(element.decorators) : [],
                        visibility: visibility,
                        override: "override" in element ? element.override : undefined
                    });
                }
                
            } else if(element.kind === "constructor") {
                // constructor
                const functionType = parseMethodType(sourceData, decl, element, methodName, jsPrivate);
                if(functionType) {
                    const parameterProperties = extractParameterProperties(functionType, element);
                    constr = {
                        parameters: composeMethodParameters(functionType, element),
                        parameterProperties: parameterProperties
                    };
                }
            } else if(element.kind === "get") {
                // getter
                const functionType = parseMethodType(sourceData, decl, element, methodName, jsPrivate);
                if(functionType) {
                    getters.push({
                        methodName: methodName,
                        returnType: functionType.returnType,
                        decorators: "decorators" in element ? parseDecorators(element.decorators) : [],
                        visibility: visibility,
                        override: "override" in element ? element.override : undefined
                    });
                }
            } else {
                // setter
                const functionType = parseMethodType(sourceData, decl, element, methodName, jsPrivate);
                if(functionType) {
                    setters.push({
                        methodName: methodName,
                        parameters: composeMethodParameters(functionType, element),
                        decorators: "decorators" in element ? parseDecorators(element.decorators) : [],
                        visibility: visibility,
                        override: "override" in element ? element.override : undefined
                    });
                }
            }
        } else {
            // TODO: handle other class level declarations e.g. index signatures
        }
    }

    return [methods, properties, getters, setters, constr];
}

/** 
 * Returns the field or method name for a given non-computed class element.
 * Also returns if the element was declared private by using a #
 */
function processMemberName(name: ClassPropertyNameNonComputed | PropertyNameNonComputed): [string, boolean] {
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
 * @returns list of parameters for method
 */
function composeMethodParameters(functionType: LCETypeFunction, 
    esClassElement: MethodDefinitionNonComputedName | TSMethodSignatureNonComputedName): LCEParameterDeclaration[] {
    const parameters: LCEParameterDeclaration[] = [];
    for(let i = 0; i < functionType.parameters.length; i++) {
        const funcTypeParam = functionType.parameters[i];
        const esParamElem = "value" in esClassElement ? esClassElement.value.params[i] : esClassElement.params[i];
        parameters.push({
            index: funcTypeParam.index,
            name: funcTypeParam.name,
            type: funcTypeParam.type,
            optional: "optional" in esParamElem && !!esParamElem.optional,
            decorators: parseDecorators(esParamElem.decorators)
        });
    }
    return parameters;
}

/**
 * For use with class constructors.
 * @param functionType parsed LCETypeFunction of the method
 * @param esClassElement ESTree class method node 
 * @returns a mapping from parameter indexes to declared parameter properties
 */
function extractParameterProperties(functionType: LCETypeFunction, 
    esClassElement: MethodDefinitionNonComputedName): Map<number, LCEPropertyDeclaration> {
    const result: Map<number, LCEPropertyDeclaration> = new Map();

    if(esClassElement.type === AST_NODE_TYPES.MethodDefinition && !esClassElement.computed && esClassElement.kind === "constructor") {
        for(let i = 0; i < functionType.parameters.length; i++) {
            const funcTypeParam = functionType.parameters[i];
            const esParamElem = esClassElement.value.params[funcTypeParam.index];
            if(esParamElem.type === AST_NODE_TYPES.TSParameterProperty) {
                result.set(funcTypeParam.index, {
                    propertyName: funcTypeParam.name,
                    optional: "optional" in esParamElem.parameter && !!esParamElem.parameter.optional,
                    readonly: !!esParamElem.readonly,
                    type: funcTypeParam.type,
                    decorators: parseDecorators(esParamElem.decorators),
                    visibility: esParamElem.accessibility ?? "public",
                    override: esParamElem.override
                });
            }
        }
    }

    return result;
}