import { Session } from 'neo4j-driver';
import { Concept } from '../concepts';
import { LCETypeScriptProject } from '../concepts/typescript-project.concept';
import ConnectionIndex from '../connection-index';
import BaseGenerator from '../generator';

export default class TypeScriptProjectFilesGenerator implements BaseGenerator {

    async run(neo4jSession: Session, concepts: Map<Concept, any>, connectionIndex: ConnectionIndex): Promise<void> {
        const project: LCETypeScriptProject = concepts.get(Concept.TYPESCRIPT_PROJECT);
        await neo4jSession.run(
            `
            MATCH (root:Directory {fileName: $projectRoot})-[:CONTAINS]->(sourceFile:File)
            WHERE NOT (sourceFile:Directory) AND sourceFile.fileName ENDS WITH '.ts'
            SET root:TS:Project
            SET sourceFile:TS:SourceFile
            RETURN root
            `,{projectRoot: project.projectRoot}
        );

        await neo4jSession.run(
            `
            MATCH (configFile:File:Json {fileName: '/tsconfig.json'})
            SET configFile:TS:ProjectConfiguration
            RETURN configFile
            `,{projectRoot: project.projectRoot}
        );
    }

}