import { Session } from 'neo4j-driver';
import { Concept } from '../concepts';
import { LCETypeScriptProject } from '../concepts/typescript-project.concept';
import BaseGenerator from '../generator';
import ConnectionIndex from '../connection-index';
import Utils from '../utils';
import { createClassLikeTypeParameterNodes, createMemberNodes } from './class-like-declaration.generator.utils';
import LCEInterfaceDeclarationIndex from '../concept-indexes/interface-declaration.index';
import { createTypeNode, createTypeParameterNodes } from './type.generator.utils';
import LCEFunctionDeclarationIndex from '../concept-indexes/function-declaration.index';
import { createFunctionParameterNodes } from './function.generator.utils';

/**
 * Generates all graph structures related to function declarations on file level.
 * This includes type parameters, return type and parameters.
 */
export default class FunctionDeclarationGenerator implements BaseGenerator {

    async run(neo4jSession: Session, concepts: Map<Concept, any>, connectionIndex: ConnectionIndex): Promise<void> {
        const project: LCETypeScriptProject = concepts.get(Concept.TYPESCRIPT_PROJECT);
        const interfaceDeclIndex: LCEFunctionDeclarationIndex = concepts.get(Concept.FUNCTION_DECLARATIONS);

        console.log("Generating graph structures for " + interfaceDeclIndex.declarations.size + " function declarations...")
        // create function structures
        for(let [fqn, funcDecl] of interfaceDeclIndex.declarations.entries()) {
            // create function node
            const funcNodeProps = {
                fqn: fqn,
                name: funcDecl.functionName,
            }
            const funcNodeId = Utils.getNodeIdFromQueryResult(await neo4jSession.run(
                `
                CREATE (func:TS:Function $funcNodeProps) 
                RETURN id(func)
                `,{funcNodeProps: funcNodeProps}
            ));
            connectionIndex.provideTypes.set(fqn, funcNodeId);

            // create type parameter nodes and connections
            const funcTypeParameters = await createTypeParameterNodes(
                funcDecl.typeParameters,
                neo4jSession,
                connectionIndex
            );
            for(let typeParamNodeId of funcTypeParameters.values()) {
                connectionIndex.connectionsToCreate.push([funcNodeId, typeParamNodeId, {name: ":DECLARES", props: {}}]);
            }

            // create return type node and connections;
            await createTypeNode(
                funcDecl.returnType,
                neo4jSession,
                connectionIndex,
                funcNodeId,
                {name: ":RETURNS", props: {}},
                funcTypeParameters
            );

            await createFunctionParameterNodes(
                funcNodeId,
                neo4jSession,
                funcDecl.parameters,
                connectionIndex,
                funcTypeParameters
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
                    sourcePath: funcDecl.sourceFilePath.replace(project.projectRoot, ""),
                    interfaceId: funcNodeId
                }
            );
        }

        // TODO: add dependencies
    }

}