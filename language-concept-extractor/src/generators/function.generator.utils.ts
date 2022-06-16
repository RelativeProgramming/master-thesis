import { Integer, Session } from 'neo4j-driver';
import { LCEParameterDeclaration } from '../concepts/method-declaration.concept';
import { ConnectionIndex } from '../connection-index';
import { Utils } from '../utils';
import { createDecoratorNode } from './decorator.generator.utils';
import { createTypeNode } from './type.generator.utils';


export async function createFunctionParameterNodes(
    functionNodeId: Integer, 
    neo4jSession: Session, 
    parameters: LCEParameterDeclaration[],
    connectionIndex: ConnectionIndex,
    parentTypeParamNodes: Map<string, Integer> = new Map(),
    methodTypeParamNodes: Map<string, Integer> = new Map()
): Promise<Map<number, Integer>> {
    const result: Map<number, Integer> = new Map();
    for(let i = 0; i < parameters.length; i++) {
        const param = parameters[i];
        const paramNodeId = await createFunctionParameterNode(
            param,
            neo4jSession,
            connectionIndex,
            parentTypeParamNodes,
            methodTypeParamNodes
        );
        result.set(param.index, Utils.getNodeIdFromQueryResult(await neo4jSession.run(
            `
            MATCH (method)
            MATCH (param)
            WHERE id(method) = $methodNodeId AND id(param) = $paramNodeId
            CREATE (method)-[:HAS]->(param)
            RETURN id(param)
            `, {methodNodeId: functionNodeId, paramNodeId: paramNodeId}
        )));
    }

    return result;
}

export async function createFunctionParameterNode(
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