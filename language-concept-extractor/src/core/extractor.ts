import { parseAndGenerateServices } from "@typescript-eslint/typescript-estree";
import * as fs from "fs";
import { auth as neo4jAuth, driver as neo4jDriver } from "neo4j-driver";
import path from "path";
import { TypeChecker } from "typescript";

import { ConceptMap, LCEConcept, mergeConceptMaps, singleEntryConceptMap, unifyConceptMap } from "./concept";
import { LCETypeScriptProject } from "./concepts/typescript-project.concept";
import { ConnectionIndex } from "./connection-index";
import { GlobalContext } from "./context";
import { GENERATORS } from "./features";
import { PathUtils } from "./path.utils";
import { AstTraverser } from "./traversers/ast.traverser";
import { Utils } from "./utils";

export function processProject(projectRoot: string) {
    // TODO: take tsconfig.json into consideration (assumes projectRoot = path that contains tsconfig.json)
    // see https://www.typescriptlang.org/docs/handbook/project-references.html#what-is-a-project-reference

    projectRoot = path.resolve(projectRoot);
    const fileList = Utils.getProjectSourceFileList(projectRoot);

    // maps filenames to the extracted concepts from these files
    let concepts: ConceptMap = singleEntryConceptMap(LCETypeScriptProject.conceptId, new LCETypeScriptProject(projectRoot));

    console.log("Analyzing " + fileList.length + " project files...");
    const startTime = process.hrtime();

    const traverser = new AstTraverser();

    for (const file of fileList) {
        const code = fs.readFileSync(file, "utf8");
        const { ast, services } = parseAndGenerateServices(code, {
            loc: true,
            range: true,
            tokens: false,
            filePath: file,
            project: projectRoot + "/tsconfig.json",
        });
        const typeChecker: TypeChecker = services.program.getTypeChecker();

        const globalContext: GlobalContext = {
            projectRootPath: projectRoot,
            sourceFilePath: PathUtils.normalize(projectRoot, file),
            ast: ast,
            services: services,
            typeChecker: typeChecker,
        };

        concepts = mergeConceptMaps(concepts, unifyConceptMap(traverser.traverse(globalContext), file.replace(globalContext.projectRootPath, ".")));
    }

    const endTime = process.hrtime();
    console.log("Finished analyzing project files. Runtime: " + (endTime[0] - startTime[0]) + "s");

    const normalizedConcepts = unifyConceptMap(concepts, "").get("");
    if (normalizedConcepts) generateGraphs(normalizedConcepts);
}

async function generateGraphs(concepts: Map<string, LCEConcept[]>) {
    console.log("Generating graph...");
    const startTime = process.hrtime();
    const driver = neo4jDriver("bolt://localhost:7687", neo4jAuth.basic("", ""));
    const session = driver.session();
    const connectionIndex = new ConnectionIndex();

    try {
        for (const generator of GENERATORS) {
            await generator.run(session, concepts, connectionIndex);
        }
    } finally {
        await session.close();
    }
    await driver.close();
    const endTime = process.hrtime();
    console.log("Finished generating graph. Runtime: " + (endTime[0] - startTime[0]) + "s");
}
