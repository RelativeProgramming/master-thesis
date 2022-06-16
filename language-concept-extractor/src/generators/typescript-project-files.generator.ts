import { Session } from 'neo4j-driver';
import { ConceptIndex } from '../features';
import { LCETypeScriptProject } from '../concepts/typescript-project.concept';
import { ConnectionIndex } from '../connection-index';
import { BaseGenerator } from '../generator';

export class TypeScriptProjectFilesGenerator implements BaseGenerator {

    async run(neo4jSession: Session, concepts: Map<ConceptIndex, any>, connectionIndex: ConnectionIndex): Promise<void> {
        // TODO: add exception of directories like `node_modules`
        const project: LCETypeScriptProject = concepts.get(ConceptIndex.TYPESCRIPT_PROJECT);
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