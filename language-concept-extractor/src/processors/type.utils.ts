import {ClassPropertyNameNonComputed, ClassDeclaration, MethodDefinitionNonComputedName, FunctionExpression, Identifier} from '@typescript-eslint/types/dist/generated/ast-spec'
import { TypeReference, Type, Node, isTypeParameterDeclaration, Signature, Symbol, SignatureKind} from 'typescript';
import { LCETypeParameterDeclaration } from '../concepts/type-parameter.concept';
import LCEType, { LCETypeFunction, LCETypeIntersection, LCETypeNotIdentified, LCETypeObject, LCETypeParameter, LCETypeDeclared, LCETypeUnion, LCETypePrimitive, LCETypeFunctionParameter } from '../concepts/type.concept';
import { SourceData } from '../processor';
import Utils from '../utils';


/**
 * Returns the type for a given class property (with a non-computed name)
 * @param esProperty property name node provided in ESTree
 * @returns LCEType with encoded type information
 */
export function parseClassPropertyType(sourceData: SourceData, esProperty: ClassPropertyNameNonComputed): LCEType {
    const node = sourceData.services.esTreeNodeToTSNodeMap.get(esProperty)
    return parseType(
        sourceData, 
        sourceData.typeChecker.getTypeAtLocation(node),
        node
    );
}

/**
 * Returns the type for a given class method (with a non-computed name).
 * This includes constructors, getters and setters.
 * @param esProperty method name node provided in ESTree
 * @returns LCEType with encoded type information
 */
export function parseClassMethodType(
     sourceData: SourceData, 
     esClassDecl: ClassDeclaration, 
     esMethodDecl: MethodDefinitionNonComputedName, 
     methodName: string, 
     jsPrivate: boolean): LCETypeFunction | undefined {
    const tc = sourceData.typeChecker;
    const classNode = sourceData.services.esTreeNodeToTSNodeMap.get(esClassDecl);
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
                // TODO: handle different constructor parameter variants (model expansion)
                if(esParam.type == "TSParameterProperty") {
                    esParam = esParam.parameter;
                }
                const paramNode = sourceData.services.esTreeNodeToTSNodeMap.get(esParam);
                const paramType = tc.getTypeAtLocation(paramNode);
                parameters.push(
                    new LCETypeFunctionParameter(
                        i, 
                        (esParam as Identifier).name, 
                        parseType(sourceData, paramType, paramNode)
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
                parseType(sourceData, methodType, methodNode),
                [],
                []
            );
        } else if(esMethodDecl.kind === "set") {
            // setter
            const paramName = (esMethodDecl.value.params[0] as Identifier).name;
            const esParam = esMethodDecl.value.params[0];
            const paramNode = sourceData.services.esTreeNodeToTSNodeMap.get(esParam);
            const paramType = tc.getTypeAtLocation(paramNode);
            return new LCETypeFunction(
                new LCETypeNotIdentified("setter"),
                [new LCETypeFunctionParameter(0, paramName, parseType(sourceData, paramType, methodNode))],
                []
            );
        }
    }

    const returnType = parseType(sourceData, methodSignature.getReturnType(), methodNode);
    const typeParameters = parseFunctionTypeParameters(sourceData, methodSignature, methodNode);
    
    const parameters: LCETypeFunctionParameter[] = [];
    const parameterSyms = methodSignature.getParameters();
    for(let i = 0; i < parameterSyms.length; i++) {
        const paraSym = parameterSyms[i];
        const parameterType = tc.getTypeOfSymbolAtLocation(paraSym, methodNode);
        parameters.push(
            new LCETypeFunctionParameter(
                i, 
                paraSym.name, 
                parseType(sourceData, parameterType, methodNode)
            )
        );
    }

    return new LCETypeFunction(
        returnType,
        parameters,
        typeParameters
    );
}

/**
 * Returns the type parameters declared for a given class
 * @param esClass class declaration node provided in ESTree
 * @returns Array of LCEGenericsTypeVariable with encoded type parameter information
 */
export function parseClassTypeParameters(sourceData: SourceData, esClass: ClassDeclaration): LCETypeParameterDeclaration[] {
    const node = sourceData.services.esTreeNodeToTSNodeMap.get(esClass);
    return parseClassLikeTypeParameters(
        sourceData,
        sourceData.typeChecker.getTypeAtLocation(node),
        node
    );
}

function parseType(sourceData: SourceData, type: Type, node: Node) : LCEType {
    const tc = sourceData.typeChecker;

    const symbol = type.symbol ? 
        type.symbol :
        type.aliasSymbol ?
            type.aliasSymbol :
            undefined
    const fqn = symbol ? tc.getFullyQualifiedName(symbol) : undefined;
    
    if((!fqn || fqn === "__type") && !isPrimitiveType(tc.typeToString(type))) {
        // complex anonymous type
        if(type.isUnion()) {
            // union type
            return new LCETypeUnion(type.types.map((t) => parseType(sourceData, t, node)));
        } else if(type.isIntersection()) {
            // intersection type
            return new LCETypeIntersection(type.types.map((t) => parseType(sourceData, t, node)));
        } else if(type.getCallSignatures().length > 0) {
            if(type.getCallSignatures().length > 1)
                return new LCETypeNotIdentified(tc.typeToString(type));
            // function type
            const signature = type.getCallSignatures()[0];
            const returnType = parseType(sourceData, tc.getReturnTypeOfSignature(signature), node);
            const parameters: LCETypeFunctionParameter[] = [];
            const paramSyms = signature.getParameters();
            for(let i = 0; i < paramSyms.length; i++) {
                let parameterSym = paramSyms[i];
                const paramType = tc.getTypeOfSymbolAtLocation(parameterSym, node);
                parameters.push(
                    new LCETypeFunctionParameter(
                        i, 
                        parameterSym.name, 
                        parseType(sourceData, paramType, node)
                    )
                );
            }
            const typeParameters = parseFunctionTypeParameters(sourceData, signature, node);
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
                members.set(prop.name, parseType(sourceData, propType, node));
            }
            return new LCETypeObject(members);
        }

        // TODO: Detect Callable Types
        // TODO: Detect Literal Types
        // TODO: Detect Tuple Types

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
        const sourceFile = symbol?.valueDeclaration?.getSourceFile();
        const hasSource = !!sourceFile;
        const isStandardLibrary = hasSource && sourceData.services.program.isSourceFileDefaultLibrary(sourceFile!)
        const isExternal = hasSource && sourceData.services.program.isSourceFileFromExternalLibrary(sourceFile!);

        const inProject = !isStandardLibrary && !isExternal;
        const name = inProject ? Utils.getRelativeFQN(sourceData, fqn) : fqn;
        const typeArguments: LCEType[] = tc.getTypeArguments(type as TypeReference).map((t) => parseType(sourceData, t, node));
    
        return new LCETypeDeclared(
            name,
            inProject,
            typeArguments
        );
    }

    
}

function isPrimitiveType(typeStr: string): boolean {
    return ["undefined", "null", "void", "any", "unknown", "number", "bigint", "boolean", "string", "symbol", "object"]
    .includes(typeStr);
}

function parseClassLikeTypeParameters(sourceData: SourceData, type: Type, node: Node): LCETypeParameterDeclaration[] {
    const tc = sourceData.typeChecker;
    const result: LCETypeParameterDeclaration[] = [];
    for(let typeParam of tc.getTypeArguments(type as TypeReference)) {
        const name = type.symbol.name;
        let constraintType: LCEType;

        const typeParamDecl = typeParam.symbol.declarations![0];
        if(isTypeParameterDeclaration(typeParamDecl) && typeParamDecl.constraint) {
            constraintType = parseType(
                sourceData, 
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

function parseFunctionTypeParameters(sourceData: SourceData, signature: Signature, node: Node): LCETypeParameterDeclaration[] {
    const result: LCETypeParameterDeclaration[] = [];
    const typeParameters = signature.getTypeParameters();
    if(typeParameters) {
        for(let typeParam of typeParameters) {
            const name = typeParam.symbol.name;
            let constraintType: LCEType;

            const constraint = typeParam.getConstraint();
            if(constraint) {
                constraintType = parseType(
                    sourceData, 
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