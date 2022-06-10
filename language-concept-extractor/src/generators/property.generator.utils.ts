import { Integer, Session } from 'neo4j-driver';
import { LCEPropertyDeclaration } from '../concepts/property-declaration.concept';
import ConnectionIndex from '../connection-index';
import Utils from '../utils';
import { createDecoratorNode } from './decorator.generator.utils';
import { createTypeNode } from './type.generator.utils';


export async function createPropertyNode(
    propertyDecl: LCEPropertyDeclaration, 
    neo4jSession: Session,
    connectionIndex: ConnectionIndex,
    parentTypeParamNodes: Map<string, Integer> = new Map(),
): Promise<Integer> {

    // create property node
    const propertyNodeProps = {
        name: propertyDecl.propertyName,
        optional: propertyDecl.optional,
        visibility: propertyDecl.visibility,
        readonly: propertyDecl.readonly,
        override: propertyDecl.override
    }
    const propNodeId = Utils.getNodeIdFromQueryResult(await neo4jSession.run(
        `
        CREATE (property:TS:Property $propertyNodeProps)
        RETURN id(property)
        `, {propertyNodeProps: propertyNodeProps}
    ));
    
    // create property decorator nodes and connections
    for(let deco of propertyDecl.decorators) {
        const decoNodeId = await createDecoratorNode(deco, neo4jSession);
        await neo4jSession.run(
            `
            MATCH (prop:TS:Property)
            MATCH (deco:TS:Decorator)
            WHERE id(prop) = $propNodeId AND id(deco) = $decoNodeId
            CREATE (prop)-[:DECORATED_BY]->(deco)
            RETURN deco
            `, {propNodeId: propNodeId, decoNodeId: decoNodeId}
        )
    }

    // create property type nodes
    const typeNodeId = await createTypeNode(
        propertyDecl.type,
        neo4jSession,
        connectionIndex,
        propNodeId,
        {name: ":OF_TYPE", props: {}},
        parentTypeParamNodes
    );

    return propNodeId;
}