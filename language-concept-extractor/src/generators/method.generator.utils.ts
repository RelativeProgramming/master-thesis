import { Integer, Session } from 'neo4j-driver';
import { LCEDecorator } from '../concepts/decorator.concept';
import { LCEConstructorDeclaration, LCEGetterDeclaration, LCEMethodDeclaration, LCEParameterDeclaration, LCESetterDeclaration } from '../concepts/method-declaration.concept';
import DeclaredTypesNodeIndex from '../node-indexes/declared-types.node-index';
import Utils from '../utils';
import { createDecoratorNode } from './decorator.generator.utils';
import { createTypeNode, createTypeParameterNodes } from './type.generator.utils';


export async function createMethodNode(
    methodDecl: LCEMethodDeclaration, 
    neo4jSession: Session,
    declaredTypesNodeIndex: DeclaredTypesNodeIndex,
    parentTypeParamNodes: Map<string, Integer> = new Map(),
): Promise<Integer> {

    // create method node
    const methodNodeProps = {
        name: methodDecl.methodName
    }
    const methodNodeId = Utils.getNodeIdFromQueryResult(await neo4jSession.run(
        `
        CREATE (method:TS:Method $methodNodeProps)
        RETURN id(method)
        `, {methodNodeProps: methodNodeProps}
    ));
    
    // create method decorator nodes and connections
    await createMethodDecorators(methodNodeId, neo4jSession, methodDecl.decorators);

    // create method type parameter nodes and connections
    const methodTypeParamNodes = await createTypeParameterNodes(
        methodDecl.typeParameters,
        neo4jSession,
        declaredTypesNodeIndex,
        parentTypeParamNodes
    );
    for(let typeParamNodeId of methodTypeParamNodes.values()) {
        await neo4jSession.run(
            `
            MATCH (method:TS:Method)
            MATCH (typeParam:TS:Type:Parameter)
            WHERE id(method) = $methodNodeId AND id(typeParam) = $typeParamNodeId
            CREATE (method)-[:DECLARES]->(typeParam)
            RETURN typeParam
            `, {methodNodeId: methodNodeId, typeParamNodeId: typeParamNodeId}
        );
    }

    // create method parameter nodes and connections
    await createMethodParameters(
        methodNodeId,
        neo4jSession,
        methodDecl.parameters,
        declaredTypesNodeIndex,
        parentTypeParamNodes,
        methodTypeParamNodes
    );

    // create method return type nodes
    const typeNodeId = await createTypeNode(
        methodDecl.returnType,
        neo4jSession,
        declaredTypesNodeIndex,
        methodNodeId,
        {},
        parentTypeParamNodes,
        methodTypeParamNodes
    );

    // TODO: add method references

    return methodNodeId;
}

export async function createConstructorNode(
    constructorDecl: LCEConstructorDeclaration, 
    neo4jSession: Session,
    declaredTypesNodeIndex: DeclaredTypesNodeIndex,
    parentTypeParamNodes: Map<string, Integer> = new Map(),
): Promise<Integer> {
    // create constructor node
    const constructorNodeId = Utils.getNodeIdFromQueryResult(await neo4jSession.run(
        `
        CREATE (constructor:TS:Method:Constructor)
        RETURN id(constructor)
        `
    ));

    // create constructor parameter nodes and connections
    await createMethodParameters(
        constructorNodeId,
        neo4jSession,
        constructorDecl.parameters,
        declaredTypesNodeIndex,
        parentTypeParamNodes
    );

    return constructorNodeId;
}

export async function createGetterNode(
    getterDecl: LCEGetterDeclaration, 
    neo4jSession: Session,
    declaredTypesNodeIndex: DeclaredTypesNodeIndex,
    parentTypeParamNodes: Map<string, Integer> = new Map(),
): Promise<Integer> {
    // create getter node
    const getterNodeProps = {
        name: getterDecl.methodName
    }
    const getterNodeId = Utils.getNodeIdFromQueryResult(await neo4jSession.run(
        `
        CREATE (getter:TS:Method:Getter $getterNodeProps)
        RETURN id(getter)
        `, {getterNodeProps: getterNodeProps}
    ));

    // create getter decorator nodes and connections
    await createMethodDecorators(getterNodeId, neo4jSession, getterDecl.decorators);
    
    // create getter return type nodes
    const typeNodeId = await createTypeNode(
        getterDecl.returnType,
        neo4jSession,
        declaredTypesNodeIndex,
        getterNodeId,
        {},
        parentTypeParamNodes
    );

    return getterNodeId;
}

export async function createSetterNode(
    setterDecl: LCESetterDeclaration, 
    neo4jSession: Session,
    declaredTypesNodeIndex: DeclaredTypesNodeIndex,
    parentTypeParamNodes: Map<string, Integer> = new Map(),
): Promise<Integer> {
    // create setter node
    const setterNodeProps = {
        name: setterDecl.methodName
    }
    const setterNodeId = Utils.getNodeIdFromQueryResult(await neo4jSession.run(
        `
        CREATE (setter:TS:Method:Setter $setterNodeProps)
        RETURN id(setter)
        `, {setterNodeProps: setterNodeProps}
    ));

    // create setter decorator nodes and connections
    await createMethodDecorators(setterNodeId, neo4jSession, setterDecl.decorators);
    
    // create setter parameter nodes and connections
    await createMethodParameters(
        setterNodeId,
        neo4jSession,
        setterDecl.parameters,
        declaredTypesNodeIndex,
        parentTypeParamNodes
    );

    return setterNodeId;
}

async function createMethodDecorators(
    methodNodeId: Integer, 
    neo4jSession: Session, 
    decorators: LCEDecorator[]
): Promise<void> {
    for(let deco of decorators) {
        const decoNodeId = await createDecoratorNode(deco, neo4jSession);
        await neo4jSession.run(
            `
            MATCH (method)
            MATCH (deco:TS:Decorator)
            WHERE id(method) = $methodNodeId AND id(deco) = $decoNodeId
            CREATE (method)-[:DECORATED_BY]->(deco)
            RETURN deco
            `, {methodNodeId: methodNodeId, decoNodeId: decoNodeId}
        )
    }
}

async function createMethodParameters(
    methodNodeId: Integer, 
    neo4jSession: Session, 
    parameters: LCEParameterDeclaration[],
    declaredTypesNodeIndex: DeclaredTypesNodeIndex,
    parentTypeParamNodes: Map<string, Integer> = new Map(),
    methodTypeParamNodes: Map<string, Integer> = new Map()
): Promise<void> {
    for(let param of parameters) {
        const paramNodeId = await createParameterNode(
            param,
            neo4jSession,
            declaredTypesNodeIndex,
            parentTypeParamNodes,
            methodTypeParamNodes
        );
        await neo4jSession.run(
            `
            MATCH (method)
            MATCH (param:TS:Parameter)
            WHERE id(method) = $methodNodeId AND id(param) = $paramNodeId
            CREATE (method)-[:HAS]->(param)
            RETURN param
            `, {methodNodeId: methodNodeId, paramNodeId: paramNodeId}
        )
    }
}

export async function createParameterNode(
    parameterDecl: LCEParameterDeclaration, 
    neo4jSession: Session,
    declaredTypesNodeIndex: DeclaredTypesNodeIndex,
    parentTypeParamNodes: Map<string, Integer> = new Map(),
    methodTypeParamNodes: Map<string, Integer> = new Map(),
): Promise<Integer> {

    // create parameter node
    const parameterNodeProps = {
        index: parameterDecl.index,
        name: parameterDecl.name
    }
    const parameterNodeId = Utils.getNodeIdFromQueryResult(await neo4jSession.run(
        `
        CREATE (param:TS:Parameter $parameterNodeProps)
        RETURN id(param)
        `, {parameterNodeProps: parameterNodeProps}
    ));
    
    // create parameter decorator nodes and connections
    for(let deco of parameterDecl.decorators) {
        const decoNodeId = await createDecoratorNode(deco, neo4jSession);
        await neo4jSession.run(
            `
            MATCH (param:TS:Parameter)
            MATCH (deco:TS:Decorator)
            WHERE id(param) = $parameterNodeId AND id(deco) = $decoNodeId
            CREATE (param)-[:DECORATED_BY]->(deco)
            RETURN deco
            `, {parameterNodeId: parameterNodeId, decoNodeId: decoNodeId}
        )
    }

    // create parameter type nodes
    const typeNodeId = await createTypeNode(
        parameterDecl.type,
        neo4jSession,
        declaredTypesNodeIndex,
        parameterNodeId,
        {},
        parentTypeParamNodes,
        methodTypeParamNodes
    );

    return parameterNodeId;
}

