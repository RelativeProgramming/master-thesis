import { Integer, Session } from 'neo4j-driver';
import { LCEDecorator } from '../concepts/decorator.concept';
import { LCEConstructorDeclaration, LCEGetterDeclaration, LCEMethodDeclaration, LCEParameterDeclaration, LCESetterDeclaration } from '../concepts/method-declaration.concept';
import { ConnectionIndex } from '../connection-index';
import { Utils } from '../utils';
import { createDecoratorNode } from './decorator.generator.utils';
import { createFunctionParameterNodes } from './function.generator.utils';
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
        fqn: methodDecl.fqn,
        visibility: methodDecl.visibility,
        override: methodDecl.override
    }
    const methodNodeId = Utils.getNodeIdFromQueryResult(await neo4jSession.run(
        `
        CREATE (method:TS:Method $methodNodeProps)
        RETURN id(method)
        `, {methodNodeProps}
    ));
    
    // create method decorator nodes and connections
    await createMethodDecorators(methodNodeId, neo4jSession, connectionIndex, methodDecl.decorators);

    // create method type parameter nodes and connections
    if(methodDecl.methodName === "myFuncTest") {
        methodDecl
    }
    const methodTypeParamNodes = await createTypeParameterNodes(
        methodDecl.typeParameters,
        neo4jSession,
        connectionIndex,
        parentTypeParamNodes
    );
    for(let typeParamNodeId of methodTypeParamNodes.values()) {
        connectionIndex.connectionsToCreate.push([methodNodeId, typeParamNodeId, {name: ":DECLARES", props: {}}]);
    }

    // create method parameter nodes and connections
    await createFunctionParameterNodes(
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
    const constructorProps = {
        name: "constructor",
        fqn: constructorDecl.fqn,
    }
    const constructorNodeId = Utils.getNodeIdFromQueryResult(await neo4jSession.run(
        `
        CREATE (constructor:TS:Method:Constructor $constructorProps)
        RETURN id(constructor)
        `, { constructorProps }
    ));

    // create constructor parameter nodes and connections
    const paramNodeIds = await createFunctionParameterNodes(
        constructorNodeId,
        neo4jSession,
        constructorDecl.parameters,
        connectionIndex,
        parentTypeParamNodes
    );

    // create parameter property nodes and connections
    for(let paramProp of constructorDecl.parameterProperties) {
        const paramNodeId = paramNodeIds.get(paramProp.index)!;
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
    connectionIndex: ConnectionIndex,
    parentTypeParamNodes: Map<string, Integer> = new Map(),
): Promise<Integer> {
    // create getter node
    const getterNodeProps = {
        name: getterDecl.methodName,
        fqn: getterDecl.fqn,
        visibility: getterDecl.visibility,
        override: getterDecl.override
    }
    const getterNodeId = Utils.getNodeIdFromQueryResult(await neo4jSession.run(
        `
        CREATE (getter:TS:Method:Getter $getterNodeProps)
        RETURN id(getter)
        `, {getterNodeProps: getterNodeProps}
    ));

    // create getter decorator nodes and connections
    await createMethodDecorators(getterNodeId, neo4jSession, connectionIndex, getterDecl.decorators);
    
    // create getter return type nodes
    const typeNodeId = await createTypeNode(
        getterDecl.returnType,
        neo4jSession,
        connectionIndex,
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
        fqn: setterDecl.fqn,
        visibility: setterDecl.visibility,
        override: setterDecl.override
    }
    const setterNodeId = Utils.getNodeIdFromQueryResult(await neo4jSession.run(
        `
        CREATE (setter:TS:Method:Setter $setterNodeProps)
        RETURN id(setter)
        `, {setterNodeProps: setterNodeProps}
    ));

    // create setter decorator nodes and connections
    await createMethodDecorators(setterNodeId, neo4jSession, connectionIndex, setterDecl.decorators);
    
    // create setter parameter nodes and connections
    await createFunctionParameterNodes(
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
    connectionIndex: ConnectionIndex,
    decorators: LCEDecorator[]
): Promise<void> {
    for(let deco of decorators) {
        await createDecoratorNode(deco, neo4jSession, connectionIndex, methodNodeId, {name: ":DECORATED_BY", props: {}});
    }
}
