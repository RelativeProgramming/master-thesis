import { Integer, Session } from 'neo4j-driver';
import { Concept } from '../concepts';
import LCEClassDeclarationIndex from '../concepts/class-declaration.concept';
import { LCETypeScriptProject } from '../concepts/typescript-project.concept';
import BaseGenerator from '../generator';
import ConnectionIndex from '../connection-index';
import Utils from '../utils';
import { createDecoratorNode } from './decorator.generator.utils';
import { createConstructorNode, createGetterNode, createMethodNode, createSetterNode } from './method.generator.utils';
import { createPropertyNode } from './property.generator.utils';
import { createTypeParameterNodes } from './type.generator.utils';

/**
 * Generates all graph structures related to a class declarations.
 * This includes type parameters, properties, methods, along with their types.
 * 
 * NOTE: type-related connections are registered with the `ConnectionIndex` for later creation.
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

            // create class decorator structures and connections
            for(let deco of classDecl.decorators) {
                const decoratorNodeId = await createDecoratorNode(deco, neo4jSession);
                await neo4jSession.run(
                    `
                    MATCH (class)
                    MATCH (deco)
                    WHERE id(class) = $classNodeId AND id(deco) = $decoratorNodeId
                    CREATE (class)-[:DECORATED_BY]->(deco)
                    RETURN deco
                    `, {classNodeId: classNodeId, decoratorNodeId: decoratorNodeId}
                );
            }

            // create type parameter structures and connections
            const classTypeParameters: Map<string, Integer> = await createTypeParameterNodes(
                classDecl.typeParameters,
                neo4jSession,
                connectionIndex
            );
            for(let typeParamNodeId of classTypeParameters.values()) {
                await neo4jSession.run(
                    `
                    MATCH (class)
                    MATCH (typeParam)
                    WHERE id(class) = $classNodeId AND id(typeParam) = $typeParamNodeId
                    CREATE (class)-[:DECLARES]->(typeParam)
                    RETURN typeParam
                    `, {classNodeId: classNodeId, typeParamNodeId: typeParamNodeId}
                );
            }

            // create property structures and connections
            for(let propertyDecl of classDecl.properties) {
                const propNodeId = await createPropertyNode(
                    propertyDecl,
                    neo4jSession,
                    connectionIndex,
                    classTypeParameters
                );
                await neo4jSession.run(
                    `
                    MATCH (class)
                    MATCH (prop)
                    WHERE id(class) = $classNodeId AND id(prop) = $propNodeId
                    CREATE (class)-[:DECLARES]->(prop)
                    RETURN prop
                    `, {classNodeId: classNodeId, propNodeId: propNodeId}
                );
            }
            
            // create method, constructor, getter and setter structures and connections
            const methodQuery = `
                MATCH (class)
                MATCH (method)
                WHERE id(class) = $classNodeId AND id(method) = $methodNodeId
                CREATE (class)-[:DECLARES]->(method)
                RETURN method
            `;
            for(let methodDecl of classDecl.methods) {
                const methodNodeId = await createMethodNode(
                    methodDecl,
                    neo4jSession,
                    connectionIndex,
                    classTypeParameters
                );
                await neo4jSession.run(methodQuery, {classNodeId: classNodeId, methodNodeId: methodNodeId});
            }
            if(classDecl.constr) {
                const constructorNodeId = await createConstructorNode(
                    classDecl.constr,
                    neo4jSession,
                    connectionIndex,
                    classTypeParameters
                );
                await neo4jSession.run(methodQuery, {classNodeId: classNodeId, methodNodeId: constructorNodeId});
            }
            for(let getterDecl of classDecl.getters) {
                const getterNodeId = await createGetterNode(
                    getterDecl,
                    neo4jSession,
                    connectionIndex,
                    classTypeParameters
                );
                await neo4jSession.run(methodQuery, {classNodeId: classNodeId, methodNodeId: getterNodeId});
            }
            for(let setterDecl of classDecl.setters) {
                const setterNodeId = await createSetterNode(
                    setterDecl,
                    neo4jSession,
                    connectionIndex,
                    classTypeParameters
                );
                await neo4jSession.run(methodQuery, {classNodeId: classNodeId, methodNodeId: setterNodeId});
            }

            // link to class declaration to source file
            await neo4jSession.run(
                `
                MATCH (class)
                MATCH (file:TS:SourceFile {fileName: $sourcePath})
                WHERE id(class) = $classId
                CREATE (file)-[:DECLARES]->(class)
                RETURN class
                `, {
                    classProps: classNodeProps, 
                    sourcePath: classDecl.sourceFilePath.replace(project.projectRoot, ""),
                    classId: classNodeId
                }
            );
        }

        // TODO: add dependencies
    }

}