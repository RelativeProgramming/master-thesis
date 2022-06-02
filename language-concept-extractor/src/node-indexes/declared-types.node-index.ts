import { Integer } from "neo4j-driver"

export default class DeclaredTypesNodeIndex {
    /**
     * Used for registering nodes that can be conncected to via a FQN
     */
    public provideTypes: Map<string, Integer> = new Map();

    /**
     * Used for registering connection to be made between nodes. 
     * Used when only from node of a connection is known. 
     * 
     * Value is FQN of target and potential properties of connection.
     */
    public requireTypes: Map<Integer, [string, object]> = new Map();

    /** 
     * Used for registering connection to be made between nodes. 
     * Used when both nodes of a connection are known. 
     * 
     * Pattern: `[from, to, connectionProperties]`
     * */
    public connectionsToCreate: [Integer, Integer, object][] = []
}