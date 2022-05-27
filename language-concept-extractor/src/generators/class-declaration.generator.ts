import { Session } from 'neo4j-driver';
import { Concept } from '../concepts';
import LCEClassDeclarationIndex from '../concepts/class-declaration.concept';
import { LCETypeScriptProject } from '../concepts/typescript-project.concept';
import { BaseGenerator } from '../generator';

export default class ClassDeclarationGenerator implements BaseGenerator {

    async run(neo4jSession: Session, concepts: Map<Concept, any>): Promise<void> {
        const project: LCETypeScriptProject = concepts.get(Concept.TYPESCRIPT_PROJECT);
        const index: LCEClassDeclarationIndex = concepts.get(Concept.CLASS_DECLARATIONS);

        // create class structures
        for(let [fqn, classDecl] of index.declarations.entries()) {
            const classNodeProps = {
                fqn: fqn,
                name: classDecl.className
            }
            await neo4jSession.run(
                `
                CREATE (class:TS:Class $classProps) 
                RETURN class
                `,{classProps: classNodeProps}
            );

            // create decorator structures
            for(let deco of classDecl.decorators) {
                const decoratorNodeProps = {
                    name: deco.decoratorName
                }
                await neo4jSession.run(
                    `
                    MATCH (class:TS:Class {fqn: $classProps.fqn})
                    CREATE (class)-[:DECORATED_BY]->(decorator:TS:Decorator $decoratorProps)
                    RETURN decorator
                    `, {classProps: classNodeProps, decoratorProps: decoratorNodeProps}
                );
            }

            // create property structures
            for(let propertyDecl of classDecl.properties) {
                const propertyNodeProps = {
                    name: propertyDecl.propertyName,
                    optional: propertyDecl.optional
                }
                await neo4jSession.run(
                    `
                    MATCH (class:TS:Class {fqn: $classProps.fqn})
                    CREATE (class)-[:DECLARES]->(property:TS:Property $propertyProps)
                    RETURN property
                    `, {classProps: classNodeProps, propertyProps: propertyNodeProps}
                );
            }
            
            // create method structures
            for(let methodDecl of classDecl.methods) {
                const methodNodeProps = {
                    name: methodDecl.methodName
                }
                await neo4jSession.run(
                    `
                    MATCH (class:TS:Class {fqn: $classProps.fqn})
                    CREATE (class)-[:DECLARES]->(method:TS:Method $methodProps)
                    RETURN method
                    `, {classProps: classNodeProps, methodProps: methodNodeProps}
                );
                // TODO: add method references
            }

            // link to class declaration to source file
            await neo4jSession.run(
                `
                MATCH (class:TS:Class {fqn: $classProps.fqn})
                MATCH (file:TS:SourceFile {fileName: $sourcePath})
                CREATE (file)-[:DECLARES]->(class)
                RETURN class
                `, {
                    classProps: classNodeProps, 
                    sourcePath: classDecl.sourceFilePath.replace(project.projectRoot, "")
                }
            );
        }

        // TODO: add dependencies
    }

}