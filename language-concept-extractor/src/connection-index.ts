import { Integer } from "neo4j-driver"

export default class ConnectionIndex {

    /** 
     * Used for registering connection to be made between nodes. 
     * Used when both nodes of a connection are known. 
     * 
     * Pattern: `[from, to, connectionProperties]`
     * */
    public connectionsToCreate: [Integer, Integer, ConnectionProperties][] = []


    // declared type related indexes:
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
    public requireTypes: Map<Integer, [string, ConnectionProperties]> = new Map();

    
    /**
     * Resolves all connections that were not created yet and adds the to `connectionsToCreate`
     */
    public resolve(): void {
        this.resolveRequireTypes();
    }

    /**
     * Resolves all entries in requireTypes, where a provider type can be found.
     * Adds resolved connections to `connectionsToCreate` and removes them from `requireTypes`
     */
    private resolveRequireTypes(): void {
        for(let [from, [fqn, props]] of this.requireTypes.entries()) {
            if(this.provideTypes.has(fqn)) {
                this.connectionsToCreate.push([
                    from,
                    this.provideTypes.get(fqn)!,
                    props
                ]);
                this.requireTypes.delete(from);
            }
        }
    }
}

export interface ConnectionProperties {
    name: string,
    props: object
}