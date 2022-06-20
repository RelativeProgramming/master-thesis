import { Session } from 'neo4j-driver';
import { getAndCastConcepts, LCEConcept } from '../concept';
import { LCEClassDeclaration } from '../concepts/class-declaration.concept';
import { LCETypeScriptProject } from '../concepts/typescript-project.concept';
import { ConnectionIndex } from '../connection-index';
import { Generator } from '../generator';
import { Utils } from '../utils';
import { createClassLikeTypeParameterNodes, createMemberNodes } from './class-like-declaration.generator.utils';
import { createDecoratorNode } from './decorator.generator.utils';
import { createTypeNode } from './type.generator.utils';

/**
 * Generates all graph structures related to class declarations.
 * This includes type parameters, properties, methods, along with their types.
 */
export class ClassDeclarationGenerator extends Generator {

    async run(neo4jSession: Session, concepts: Map<string, LCEConcept[]>, connectionIndex: ConnectionIndex): Promise<void> {
        const project = getAndCastConcepts<LCETypeScriptProject>(LCETypeScriptProject.conceptId, concepts)[0];
        const classDecls: LCEClassDeclaration[] = getAndCastConcepts(LCEClassDeclaration.conceptId, concepts);

        console.log("Generating graph structures for " + classDecls.length + " class declarations...")
        // create class structures
        for(let classDecl of classDecls) {
            // create class node
            const classNodeProps = {
                fqn: classDecl.fqn,
                name: classDecl.className
            }
            const classNodeId = Utils.getNodeIdFromQueryResult(await neo4jSession.run(
                `
                CREATE (class:TS:Class $classProps) 
                RETURN id(class)
                `,{classProps: classNodeProps}
            ));
            connectionIndex.provideTypes.set(classDecl.fqn, classNodeId);

            // create class decorator nodes and connections
            for(let deco of classDecl.decorators) {
                const decoratorNodeId = await createDecoratorNode(deco, neo4jSession);
                connectionIndex.connectionsToCreate.push([classNodeId, decoratorNodeId, {name: ":DECORATED_BY", props: {}}]);
            }

            // create type parameter nodes and connections
            const classTypeParameters = await createClassLikeTypeParameterNodes(
                classDecl, 
                classNodeId,
                neo4jSession,
                connectionIndex
            );

            // create type node for super class, if class has one
            if(classDecl.extendsClass) {
                await createTypeNode(
                    classDecl.extendsClass,
                    neo4jSession,
                    connectionIndex,
                    classNodeId,
                    {name: ":EXTENDS", props: {}},
                    classTypeParameters
                );
            }

            // create type nodes for interfaces that are implemented
            for(let implType of classDecl.implementsInterfaces) {
                await createTypeNode(
                    implType,
                    neo4jSession,
                    connectionIndex,
                    classNodeId,
                    {name: ":IMPLEMENTS", props: {}},
                    classTypeParameters
                );
            }

            // create property and method nodes and connections
            await createMemberNodes(
                classDecl, 
                classNodeId,
                classTypeParameters,
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