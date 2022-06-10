import { Session } from 'neo4j-driver';
import { Concept } from '../concepts';
import { LCETypeScriptProject } from '../concepts/typescript-project.concept';
import BaseGenerator from '../generator';
import ConnectionIndex from '../connection-index';
import Utils from '../utils';
import { createClassLikeTypeParameterNodes, createMemberNodes } from './class-like-declaration.generator.utils';
import LCEInterfaceDeclarationIndex from '../concept-indexes/interface-declaration.index';
import { createTypeNode } from './type.generator.utils';

/**
 * Generates all graph structures related to interface declarations.
 * This includes type parameters, properties, methods, along with their types.
 */
export default class InterfaceDeclarationGenerator implements BaseGenerator {

    async run(neo4jSession: Session, concepts: Map<Concept, any>, connectionIndex: ConnectionIndex): Promise<void> {
        const project: LCETypeScriptProject = concepts.get(Concept.TYPESCRIPT_PROJECT);
        const interfaceDeclIndex: LCEInterfaceDeclarationIndex = concepts.get(Concept.INTERFACE_DECLARATIONS);

        console.log("Generating graph structures for " + interfaceDeclIndex.declarations.size + " interface declarations...")
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

            // create type parameter nodes and connections
            const interfaceTypeParameters = await createClassLikeTypeParameterNodes(
                interfaceDecl, 
                interfaceNodeId,
                neo4jSession,
                connectionIndex
            );

            // create type nodes for interfaces that are extended
            for(let extendsType of interfaceDecl.extendsInterfaces) {
                await createTypeNode(
                    extendsType,
                    neo4jSession,
                    connectionIndex,
                    interfaceNodeId,
                    {name: ":EXTENDS", props: {}},
                    interfaceTypeParameters
                );
            }

            // create property and method nodes and connections
            await createMemberNodes(
                interfaceDecl, 
                interfaceNodeId,
                interfaceTypeParameters,
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