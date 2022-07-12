import { Integer } from "neo4j-driver"

export class ConnectionIndex {

    /** 
     * Used for registering connection to be made between nodes. 
     * Used when both nodes of a connection are known. 
     * 
     * Pattern: `[from, to, connectionProperties]`
     * */
    public connectionsToCreate: [Integer, Integer, ConnectionProperties][] = []


    /**
     * Used for registering nodes that can be conncected to via a FQN
     */
    public providerNodes: Map<string, Integer> = new Map();

    /**
     * Used for registering a connection to be made between nodes. 
     * Used when only from-node of a connection is known. 
     * 
     * Value is FQN of target and potential properties of connection.
     */
    public referenceNodes: Map<Integer, [string, ConnectionProperties]> = new Map();

    
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
        for(let [from, [fqn, props]] of this.referenceNodes.entries()) {
            if(this.providerNodes.has(fqn)) {
                this.connectionsToCreate.push([
                    from,
                    this.providerNodes.get(fqn)!,
                    props
                ]);
                this.referenceNodes.delete(from);
            }
        }
    }
}

export interface ConnectionProperties {
    name: string,
    props: object
}