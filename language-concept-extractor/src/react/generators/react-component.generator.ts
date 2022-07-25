import { Session } from "neo4j-driver";

import { Generator } from "../../core/generator";

/**
 * Marks all nodes declaring a React component.
 */
export class ReactComponentGenerator extends Generator {
    async run(neo4jSession: Session): Promise<void> {
        console.log("Generating graph structures for React components...");

        await neo4jSession.run(`
            MATCH (c:TS:Variable)-[:OF_TYPE]->(:TS:Type:Declared {referencedFqn:'"react".FC'}) 
            SET c:React:FunctionComponent
        `);
    }
}
