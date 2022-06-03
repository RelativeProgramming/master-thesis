import { Session } from 'neo4j-driver';
import { Concept } from '../concepts';
import BaseGenerator from '../generator';
import ConnectionIndex from '../connection-index';


export default class ConnectionGenerator implements BaseGenerator {

    async run(neo4jSession: Session, concepts: Map<Concept, any>, connectionIndex: ConnectionIndex): Promise<void> {
        connectionIndex.resolve();

        console.log("Generating " + connectionIndex.connectionsToCreate.length + " outstanding connections...");

        for(let [from, to, props] of connectionIndex.connectionsToCreate) {
            await neo4jSession.run(`
                MATCH (from)
                MATCH (to)
                WHERE id(from) = $fromId AND id(to) = $toId
                CREATE (from)-[` + props.name + ` $props]->(to)
                RETURN to
            `, {props: props.props, fromId: from, toId: to});
        }
        connectionIndex.connectionsToCreate = [];
    }
}