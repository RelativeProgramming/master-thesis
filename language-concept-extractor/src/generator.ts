import { Session } from 'neo4j-driver';
import { LCEConcept } from './concept';

import { ConnectionIndex } from './connection-index';

/** super class to all Graph Generators */
export abstract class Generator {

    /** 
     * Generates nodes and relations from previously extracted Concepts and inserts them into the given Neo4j database. 
     * May also use or modify exisiting nodes generated by jQAssistant.
     * 
     * Can use `nodeIndexes` to refer to specific, previously LCE-generated nodes.
     * */
    public abstract run(neo4jSession: Session, concepts: Map<string, LCEConcept[]>, connectionIndex: ConnectionIndex): Promise<void>;
}