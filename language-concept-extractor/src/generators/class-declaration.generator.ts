import { Session } from 'neo4j-driver';
import { Concept } from '../concepts';
import LCEClassDeclarationIndex from '../concepts/class-declaration.concept';
import { LCETypeScriptProject } from '../concepts/typescript-project.concept';
import BaseGenerator from '../generator';
import ConnectionIndex from '../connection-index';
import Utils from '../utils';
import { createDecoratorNode } from './decorator.generator.utils';
import { createMemberNodes } from './class-like-declaration.generator.utils';

/**
 * Generates all graph structures related to class declarations.
 * This includes type parameters, properties, methods, along with their types.
 * 
 * NOTE: connections are registered with the `ConnectionIndex` for later creation.
 */
export default class ClassDeclarationGenerator implements BaseGenerator {

    async run(neo4jSession: Session, concepts: Map<Concept, any>, connectionIndex: ConnectionIndex): Promise<void> {
        const project: LCETypeScriptProject = concepts.get(Concept.TYPESCRIPT_PROJECT);
        const classDeclIndex: LCEClassDeclarationIndex = concepts.get(Concept.CLASS_DECLARATIONS);

        console.log("Generating graph structures for " + classDeclIndex.declarations.size + " class declaration...")
        // create class structures
        for(let [fqn, classDecl] of classDeclIndex.declarations.entries()) {
            // create class node
            const classNodeProps = {
                fqn: fqn,
                name: classDecl.className
            }
            const classNodeId = Utils.getNodeIdFromQueryResult(await neo4jSession.run(
                `
                CREATE (class:TS:Class $classProps) 
                RETURN id(class)
                `,{classProps: classNodeProps}
            ));
            connectionIndex.provideTypes.set(fqn, classNodeId);

            // create class decorator nodes and connections
            for(let deco of classDecl.decorators) {
                const decoratorNodeId = await createDecoratorNode(deco, neo4jSession);
                connectionIndex.connectionsToCreate.push([classNodeId, decoratorNodeId, {name: ":DECORATED_BY", props: {}}]);
            }

            // create property and method nodes and connections
            await createMemberNodes(
                classDecl, 
                classNodeId,
                neo4jSession,
                connectionIndex
            );

            // link class declaration to source file
            await neo4jSession.run(
                `
                MATCH (class)
                MATCH (file:TS:SourceFile {fileName: $sourcePath})
                WHERE id(class) = $classId
                CREATE (file)-[:DECLARES]->(class)
                RETURN class
                `, {
                    sourcePath: classDecl.sourceFilePath.replace(project.projectRoot, ""),
                    classId: classNodeId
                }
            );
        }

        // TODO: add dependencies
    }

}