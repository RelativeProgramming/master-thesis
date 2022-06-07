import { Integer, Session } from 'neo4j-driver';
import { LCEDecorator } from '../concepts/decorator.concept';
import { LCEConstructorDeclaration, LCEGetterDeclaration, LCEMethodDeclaration, LCEParameterDeclaration, LCESetterDeclaration } from '../concepts/method-declaration.concept';
import ConnectionIndex from '../connection-index';
import Utils from '../utils';
import { createDecoratorNode } from './decorator.generator.utils';
import { createPropertyNode } from './property.generator.utils';
import { createTypeNode, createTypeParameterNodes } from './type.generator.utils';


export async function createMethodNode(
    methodDecl: LCEMethodDeclaration, 
    neo4jSession: Session,
    connectionIndex: ConnectionIndex,
    parentTypeParamNodes: Map<string, Integer> = new Map(),
): Promise<Integer> {

    // create method node
    const methodNodeProps = {
        name: methodDecl.methodName,
        visibility: methodDecl.visibility
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
        connectionIndex,
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
        connectionIndex,
        parentTypeParamNodes,
        methodTypeParamNodes
    );

    // create method return type nodes
    const typeNodeId = await createTypeNode(
        methodDecl.returnType,
        neo4jSession,
        connectionIndex,
        methodNodeId,
        {name: ":RETURNS", props: {}},
        parentTypeParamNodes,
        methodTypeParamNodes
    );

    // TODO: add method references

    return methodNodeId;
}

export async function createConstructorNode(
    constructorDecl: LCEConstructorDeclaration, 
    neo4jSession: Session,
    connectionIndex: ConnectionIndex,
    parentTypeParamNodes: Map<string, Integer> = new Map(),
    parentNodeId: Integer
): Promise<Integer> {
    // create constructor node
    const constructorNodeId = Utils.getNodeIdFromQueryResult(await neo4jSession.run(
        `
        CREATE (constructor:TS:Method:Constructor {name: "constructor"})
        RETURN id(constructor)
        `
    ));

    // create constructor parameter nodes and connections
    const paramNodeIds = await createMethodParameters(
        constructorNodeId,
        neo4jSession,
        constructorDecl.parameters,
        connectionIndex,
        parentTypeParamNodes
    );

    // create parameter property nodes and connections
    for(let [i, paramProp] of constructorDecl.parameterProperties.entries()) {
        const paramNodeId = paramNodeIds.get(i)!;
        const propNodeId = await createPropertyNode(
            paramProp,
            neo4jSession,
            connectionIndex,
            parentTypeParamNodes
        );
        connectionIndex.connectionsToCreate.push([paramNodeId, propNodeId, {name: ":DECLARES", props: {}}]);
        connectionIndex.connectionsToCreate.push([parentNodeId, propNodeId, {name: ":DECLARES", props: {}}]);
    }

    return constructorNodeId;
}

export async function createGetterNode(
    getterDecl: LCEGetterDeclaration, 
    neo4jSession: Session,
    typeReferenceNodeIndex: ConnectionIndex,
    parentTypeParamNodes: Map<string, Integer> = new Map(),
): Promise<Integer> {
    // create getter node
    const getterNodeProps = {
        name: getterDecl.methodName,
        visibility: getterDecl.visibility
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
        typeReferenceNodeIndex,
        getterNodeId,
        {name: ":RETURNS", props: {}},
        parentTypeParamNodes
    );

    return getterNodeId;
}

export async function createSetterNode(
    setterDecl: LCESetterDeclaration, 
    neo4jSession: Session,
    connectionIndex: ConnectionIndex,
    parentTypeParamNodes: Map<string, Integer> = new Map(),
): Promise<Integer> {
    // create setter node
    const setterNodeProps = {
        name: setterDecl.methodName,
        visibility: setterDecl.visibility
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
        connectionIndex,
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
    connectionIndex: ConnectionIndex,
    parentTypeParamNodes: Map<string, Integer> = new Map(),
    methodTypeParamNodes: Map<string, Integer> = new Map()
): Promise<Map<number, Integer>> {
    const result: Map<number, Integer> = new Map();
    for(let i = 0; i < parameters.length; i++) {
        const param = parameters[i];
        const paramNodeId = await createParameterNode(
            param,
            neo4jSession,
            connectionIndex,
            parentTypeParamNodes,
            methodTypeParamNodes
        );
        result.set(param.index, Utils.getNodeIdFromQueryResult(await neo4jSession.run(
            `
            MATCH (method)
            MATCH (param:TS:Parameter)
            WHERE id(method) = $methodNodeId AND id(param) = $paramNodeId
            CREATE (method)-[:HAS]->(param)
            RETURN id(param)
            `, {methodNodeId: methodNodeId, paramNodeId: paramNodeId}
        )));
    }

    return result;
}

export async function createParameterNode(
    parameterDecl: LCEParameterDeclaration, 
    neo4jSession: Session,
    connectionIndex: ConnectionIndex,
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
        connectionIndex,
        parameterNodeId,
        {name: ":OF_TYPE", props: {}},
        parentTypeParamNodes,
        methodTypeParamNodes
    );

    return parameterNodeId;
}

