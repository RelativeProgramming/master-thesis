import {
    ClassDeclaration,
    ClassPropertyNameNonComputed,
    Expression,
    FunctionDeclaration,
    Identifier,
    MethodDefinitionNonComputedName,
    TSClassImplements,
    TSInterfaceDeclaration,
    TSInterfaceHeritage,
    TSMethodSignatureNonComputedName,
    TypeNode,
    VariableDeclarator,
} from '@typescript-eslint/types/dist/generated/ast-spec';
import { isTypeParameterDeclaration, Node, PseudoBigInt, Signature, SignatureKind, Symbol, Type, TypeReference } from 'typescript';

import { LCETypeParameterDeclaration } from '../concepts/type-parameter.concept';
import {
    LCEType,
    LCETypeDeclared,
    LCETypeFunction,
    LCETypeFunctionParameter,
    LCETypeIntersection,
    LCETypeLiteral,
    LCETypeNotIdentified,
    LCETypeObject,
    LCETypeParameter,
    LCETypePrimitive,
    LCETypeTuple,
    LCETypeUnion,
} from '../concepts/type.concept';
import { GlobalContext } from '../context';
import { Utils } from '../utils';


/**
 * Returns the type for a given class property (with a non-computed name)
 * @param esProperty property name node provided in ESTree
 * @returns LCEType with encoded type information
 */
export function parseClassPropertyType(globalContext: GlobalContext, esProperty: ClassPropertyNameNonComputed): LCEType {
    const node = globalContext.services.esTreeNodeToTSNodeMap.get(esProperty)
    return parseType(
        globalContext, 
        globalContext.typeChecker.getTypeAtLocation(node),
        node
    );
}

/**
 * Returns the type for a given method (with a non-computed name).
 * This includes constructors, getters and setters.
 * @param esProperty method name node provided in ESTree
 * @returns LCEType with encoded type information
 */
export function parseMethodType(
     globalContext: GlobalContext, 
     esClassLikeDecl: ClassDeclaration | TSInterfaceDeclaration, 
     esMethodDecl: MethodDefinitionNonComputedName | TSMethodSignatureNonComputedName, 
     methodName: string, 
     jsPrivate: boolean): LCETypeFunction | undefined {
    const tc = globalContext.typeChecker;
    const classNode = globalContext.services.esTreeNodeToTSNodeMap.get(esClassLikeDecl);
    const classType = tc.getTypeAtLocation(classNode);
    let propertySym : Symbol | undefined;
    if(jsPrivate) {
        for(let sym of classType.getProperties()) {
            if(sym.getName().endsWith('#' + methodName)) {
                propertySym = sym;
                break;
            }
        }
    } else {
        propertySym = classType.getProperty(methodName);
    }

    if(propertySym === undefined)
        return undefined;
    
    const methodNode = propertySym.valueDeclaration!;
    const methodType = tc.getTypeOfSymbolAtLocation(propertySym, methodNode);
    let methodSignature = tc.getSignaturesOfType(methodType, SignatureKind.Call)[0];
    if(methodSignature === undefined) {
        if(esMethodDecl.kind === "constructor") {
            // constructor
            const parameters: LCETypeFunctionParameter[] = [];
            for(let i = 0; i < esMethodDecl.value.params.length; i++) {
                let esParam = esMethodDecl.value.params[i];
                if(esParam.type == "TSParameterProperty") {
                    esParam = esParam.parameter;
                }
                const paramNode = globalContext.services.esTreeNodeToTSNodeMap.get(esParam);
                const paramType = tc.getTypeAtLocation(paramNode);
                parameters.push(
                    new LCETypeFunctionParameter(
                        i, 
                        (esParam as Identifier).name, 
                        parseType(globalContext, paramType, paramNode)
                    )
                );
            }
            return new LCETypeFunction(
                new LCETypeNotIdentified("constructor"),
                parameters,
                []
            );
        } else if(esMethodDecl.kind === "get") {
            // getter
            return new LCETypeFunction(
                parseType(globalContext, methodType, methodNode),
                [],
                []
            );
        } else if(esMethodDecl.kind === "set") {
            // setter
            const param = "value" in esMethodDecl ? esMethodDecl.value.params[0] : esMethodDecl.params[0];
            const paramName = (param as Identifier).name;
            const esParam = param;
            const paramNode = globalContext.services.esTreeNodeToTSNodeMap.get(esParam);
            const paramType = tc.getTypeAtLocation(paramNode);
            return new LCETypeFunction(
                new LCETypeNotIdentified("setter"),
                [new LCETypeFunctionParameter(0, paramName, parseType(globalContext, paramType, methodNode))],
                []
            );
        }
    }

    // parse return type
    const returnType = parseType(globalContext, methodSignature.getReturnType(), methodNode);

    // parse type parameters
    const typeParameters = parseFunctionTypeParameters(globalContext, methodSignature, methodNode);
    
    // parse parameters
    const parameters = parseFunctionParameters(globalContext, methodSignature, methodNode);

    return new LCETypeFunction(
        returnType,
        parameters,
        typeParameters
    );
}

/** 
 * Returns the function type for a given function declaration
 */
export function parseFunctionType(globalContext: GlobalContext, esFunctionDecl: FunctionDeclaration): LCETypeFunction {
    const tc = globalContext.typeChecker;
    const methodNode = globalContext.services.esTreeNodeToTSNodeMap.get(esFunctionDecl);
    const methodType = tc.getTypeAtLocation(methodNode)
    let methodSignature = tc.getSignaturesOfType(methodType, SignatureKind.Call)[0];
    
    // parse return type
    const returnType = parseType(globalContext, methodSignature.getReturnType(), methodNode);

    // parse type parameters
    const typeParameters = parseFunctionTypeParameters(globalContext, methodSignature, methodNode);
    
    // parse parameters
    const parameters = parseFunctionParameters(globalContext, methodSignature, methodNode);

    return new LCETypeFunction(
        returnType,
        parameters,
        typeParameters
    );
}

/**
 * Returns the type parameters declared for a given class or interface
 * @param esElement declaration node provided in ESTree
 * @returns Array of LCEGenericsTypeVariable with encoded type parameter information
 */
 export function parseClassLikeTypeParameters(globalContext: GlobalContext, esElement: ClassDeclaration | TSInterfaceDeclaration): LCETypeParameterDeclaration[] {
    const node = globalContext.services.esTreeNodeToTSNodeMap.get(esElement);
    const type = globalContext.typeChecker.getTypeAtLocation(node);
    const tc = globalContext.typeChecker;
    const result: LCETypeParameterDeclaration[] = [];
    for(let typeParam of tc.getTypeArguments(type as TypeReference)) {
        const name = typeParam.symbol.name;
        let constraintType: LCEType;

        const typeParamDecl = typeParam.symbol.declarations![0];
        if(isTypeParameterDeclaration(typeParamDecl) && typeParamDecl.constraint) {
            constraintType = parseType(
                globalContext, 
                tc.getTypeAtLocation(typeParamDecl.constraint), 
                typeParamDecl
            );
        } else {
            // if no constraint is found, return empty object type (unconstrained)
            constraintType = new LCETypeObject(new Map());
        }

        result.push(new LCETypeParameterDeclaration(name, constraintType));
    }

    return result;
}

/**
 * Returns declared type for a given super type specified after `extends` or `implements`
 * @param esTypeIdentifier ESTree identifier of the super type
 * @param esTypeArguments type arguments of the super type
 * @returns 
 */
export function parseClassLikeBaseType(globalContext: GlobalContext, esTypeIdentifier: Identifier | TSClassImplements | TSInterfaceHeritage, esTypeArguments?: TypeNode[]
): LCETypeDeclared | undefined {
    const tc = globalContext.typeChecker;
    const node = globalContext.services.esTreeNodeToTSNodeMap.get(esTypeIdentifier);
    const type = tc.getTypeAtLocation(node);
    const result = parseType(globalContext, type, node);

    if(result instanceof LCETypeDeclared) {
        const typeArgs: LCEType[] = [];
        for(let esTypeArgument of esTypeArguments?? []) {
            const node = globalContext.services.esTreeNodeToTSNodeMap.get(esTypeArgument);
            const type = tc.getTypeAtLocation(node);
            typeArgs.push(parseType(globalContext, type, node));
        }
        result.typeArguments = typeArgs;
        return result;
    } else {
        return undefined;
    }
}

export function parseVariableType(globalContext: GlobalContext, esVariableDeclarator: VariableDeclarator, varName: string): LCEType {
    const tc = globalContext.typeChecker;
    const node = globalContext.services.esTreeNodeToTSNodeMap.get(esVariableDeclarator.id);
    const type = tc.getTypeAtLocation(node);
    const result = parseType(globalContext, type, node, varName);
    return result;
}

export function parseExpressionType(globalContext: GlobalContext, esExpression: Expression, varName?: string): LCEType {
    const tc = globalContext.typeChecker;
    const node = globalContext.services.esTreeNodeToTSNodeMap.get(esExpression);
    const type = tc.getTypeAtLocation(node);
    const result = parseType(globalContext, type, node, varName);
    return result;
}

export function parseTypeNode(globalContext: GlobalContext, esTypeNode: TypeNode): LCEType {
    const tc = globalContext.typeChecker;
    const node = globalContext.services.esTreeNodeToTSNodeMap.get(esTypeNode);
    const type = tc.getTypeAtLocation(node);
    const result = parseType(globalContext, type, node);
    return result;
}

function parseType(globalContext: GlobalContext, type: Type, node: Node, excludedFQN?: string) : LCEType {
    const tc = globalContext.typeChecker;

    const symbol = type.symbol ? 
        type.symbol :
        type.aliasSymbol ?
            type.aliasSymbol :
            undefined
    const fqn = symbol ? tc.getFullyQualifiedName(symbol) : undefined;

    if((!fqn || fqn === "__type" || fqn === excludedFQN) && !isPrimitiveType(tc.typeToString(type))) {
        // complex anonymous type
        if(type.isUnion()) {
            // union type
            return new LCETypeUnion(type.types.map((t) => parseType(globalContext, t, node)));
        } else if(type.isIntersection()) {
            // intersection type
            return new LCETypeIntersection(type.types.map((t) => parseType(globalContext, t, node)));
        } else if(type.getCallSignatures().length > 0) {
            if(type.getCallSignatures().length > 1)
                return new LCETypeNotIdentified(tc.typeToString(type));
            // function type
            const signature = type.getCallSignatures()[0];
            const returnType = parseType(globalContext, tc.getReturnTypeOfSignature(signature), node);
            const parameters: LCETypeFunctionParameter[] = [];
            const paramSyms = signature.getParameters();
            for(let i = 0; i < paramSyms.length; i++) {
                let parameterSym = paramSyms[i];
                const paramType = tc.getTypeOfSymbolAtLocation(parameterSym, node);
                parameters.push(
                    new LCETypeFunctionParameter(
                        i, 
                        parameterSym.name, 
                        parseType(globalContext, paramType, node)
                    )
                );
            }
            const typeParameters = parseFunctionTypeParameters(globalContext, signature, node);
            return new LCETypeFunction(
                returnType, 
                parameters,
                typeParameters
            );
        } else if(symbol?.members) {
            // anonymous object type
            // TODO: test for methods, callables, index signatures, etc.
            const members: Map<string, LCEType> = new Map();
            for(let prop of type.getProperties()) {
                const propType = tc.getTypeOfSymbolAtLocation(prop, node);
                members.set(prop.name, parseType(globalContext, propType, node));
            }
            return new LCETypeObject(members);
        } else if(type.isLiteral()) {
            // literal type
            if(isLiterNumberOrString(type.value))
                return new LCETypeLiteral(type.value);
            else
                return new LCETypeLiteral(type.value.toString());       
        } else if(tc.typeToString(type) === "true") {
            // boolean true literal
            return new LCETypeLiteral(true);
        } else if(tc.typeToString(type) === "false") {
            // boolean false literal
            return new LCETypeLiteral(false);
        } else if(tc.typeToString(type).startsWith("[")) {
            // tuple type
            const typeArgs = tc.getTypeArguments(type as TypeReference);
            const types: LCEType[] = [];
            for(let typeArg of typeArgs) {
                types.push(parseType(globalContext, typeArg, node));
            }
            return new LCETypeTuple(types);
        }

        // TODO: Detect Callable Types
        // TODO: Detect Index

        // if nothing matches return placeholder
         return new LCETypeNotIdentified(tc.typeToString(type));
    }

    if(type.isTypeParameter()) {
        // type parameter (generics)
        return new LCETypeParameter(type.symbol.name);
    }
    
    const primitive = !fqn;

    if(primitive) {
        // primitive type
        return new LCETypePrimitive(
            tc.typeToString(type)
        );
    } else {
        // declared type

        // determine if type is part of the project and should receive a relative FQN
        const inProject = Utils.isSymbolInProject(globalContext, symbol);
        const name = inProject ? Utils.getRelativeFQN(globalContext, fqn) : fqn;
        const typeArguments: LCEType[] = tc.getTypeArguments(type as TypeReference).map((t) => parseType(globalContext, t, node));
        
        // TODO: handle locally defined (non-)anonymous types (e.g. with class expressios)

        return new LCETypeDeclared(
            name,
            inProject,
            typeArguments
        );
    }

    
}

function isPrimitiveType(typeStr: string): boolean {
    return ["undefined", "null", "void", "any", "unknown", "never", "number", "bigint", "boolean", "string", "symbol", "object"]
    .includes(typeStr);
}

function isLiterNumberOrString(literalValue: number | string | PseudoBigInt): literalValue is number | string {
    return typeof literalValue === "string" || typeof literalValue === "number";
}

function parseFunctionTypeParameters(globalContext: GlobalContext, signature: Signature, node: Node): LCETypeParameterDeclaration[] {
    const result: LCETypeParameterDeclaration[] = [];
    const typeParameters = signature.getTypeParameters();
    if(typeParameters) {
        for(let typeParam of typeParameters) {
            const name = typeParam.symbol.name;
            let constraintType: LCEType;

            const constraint = typeParam.getConstraint();
            if(constraint) {
                constraintType = parseType(
                    globalContext, 
                    constraint, 
                    node
                );
            } else {
                // if no constraint is found, return empty object type (unconstrained)
                constraintType = new LCETypeObject(new Map());
            }

            result.push(new LCETypeParameterDeclaration(name, constraintType));
        }
    }

    return result;
}

function parseFunctionParameters(globalContext: GlobalContext, signature: Signature, node: Node): LCETypeFunctionParameter[] {
    const tc = globalContext.typeChecker;
    const parameters: LCETypeFunctionParameter[] = [];
    const parameterSyms = signature.getParameters();
    for(let i = 0; i < parameterSyms.length; i++) {
        const paraSym = parameterSyms[i];
        const parameterType = tc.getTypeOfSymbolAtLocation(paraSym, node);
        // const esParam = esMethodDecl.value.params[i];
        // TODO: process parameter destructuring (arrays and objects)
        // TODO: process rest parameter arguments
        // TODO: process `this` parameter (necessary?)
        // TODO: process default parameters
        parameters.push(
            new LCETypeFunctionParameter(
                i, 
                paraSym.name, 
                parseType(globalContext, parameterType, node)
            )
        );
    }
    return parameters;
}