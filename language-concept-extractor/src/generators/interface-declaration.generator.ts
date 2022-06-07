import { Session } from 'neo4j-driver';
import { Concept } from '../concepts';
import { LCETypeScriptProject } from '../concepts/typescript-project.concept';
import BaseGenerator from '../generator';
import ConnectionIndex from '../connection-index';
import Utils from '../utils';
import { createMemberNodes } from './class-like-declaration.generator.utils';
import LCEInterfaceDeclarationIndex from '../concepts/interface-declaration.concept';

/**
 * Generates all graph structures related to interface declarations.
 * This includes type parameters, properties, methods, along with their types.
 * 
 * NOTE: connections are registered with the `ConnectionIndex` for later creation.
 */
export default class InterfaceDeclarationGenerator implements BaseGenerator {

    async run(neo4jSession: Session, concepts: Map<Concept, any>, connectionIndex: ConnectionIndex): Promise<void> {
        const project: LCETypeScriptProject = concepts.get(Concept.TYPESCRIPT_PROJECT);
        const interfaceDeclIndex: LCEInterfaceDeclarationIndex = concepts.get(Concept.INTERFACE_DECLARATIONS);

        console.log("Generating graph structures for " + interfaceDeclIndex.declarations.size + " interface declaration...")
        // create interface structures
        for(let [fqn, interfaceDecl] of interfaceDeclIndex.declarations.entries()) {
            // create interface node
            const interfaceNodeProps = {
                fqn: fqn,
                name: interfaceDecl.interfaceName
            }
            const interfaceNodeId = Utils.getNodeIdFromQueryResult(await neo4jSession.run(
                `
                CREATE (interface:TS:Interface $interfaceProps) 
                RETURN id(interface)
                `,{interfaceProps: interfaceNodeProps}
            ));
            connectionIndex.provideTypes.set(fqn, interfaceNodeId);

            // create property and method nodes and connections
            await createMemberNodes(
                interfaceDecl, 
                interfaceNodeId,
                neo4jSession,
                connectionIndex
            );

            // link interface declaration to source file
            await neo4jSession.run(
                `
                MATCH (interface)
                MATCH (file:TS:SourceFile {fileName: $sourcePath})
                WHERE id(interface) = $interfaceId
                CREATE (file)-[:DECLARES]->(interface)
                RETURN interface
                `, { 
                    sourcePath: interfaceDecl.sourceFilePath.replace(project.projectRoot, ""),
                    interfaceId: interfaceNodeId
                }
            );
        }

        // TODO: add dependencies
    }

}