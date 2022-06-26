import { parseAndGenerateServices } from '@typescript-eslint/typescript-estree';
import * as fs from 'fs';
import { auth as neo4jAuth, driver as neo4jDriver } from 'neo4j-driver';
import { TypeChecker } from 'typescript';

import { ConceptMap, createConceptMap, LCEConcept, mergeConceptMaps, unifyConceptMap } from './concept';
import { LCETypeScriptProject } from './concepts/typescript-project.concept';
import { ConnectionIndex } from './connection-index';
import { GlobalContext } from './context';
import { GENERATORS } from './features';
import { AstTraverser } from './traversers/ast.traverser';
import { Utils } from './utils';

export function processProject(projectRoot: string) {
  // TODO: take tsconfig.json into consideration (assumes projectRoot = path that contains tsconfig.json)
  // see https://www.typescriptlang.org/docs/handbook/project-references.html#what-is-a-project-reference
  
  const fileList = Utils.getFileList(projectRoot, [".ts", ".tsx"], [".git", "node_modules"]);

  // maps filenames to the extracted concepts from these files
  let concepts: ConceptMap = createConceptMap(LCETypeScriptProject.conceptId, new LCETypeScriptProject(projectRoot));

  console.log("Analyzing " + fileList.length + " project files...");
  const startTime = process.hrtime();

  const traverser = new AstTraverser();

  for (let file of fileList) {
    const code = fs.readFileSync(file, 'utf8');
    const { ast, services } = parseAndGenerateServices(code, {
      loc: true,
      range: true,
      tokens: false,
      filePath: file,
      project: projectRoot + '/tsconfig.json',
    });
    const typeChecker: TypeChecker = services.program.getTypeChecker();

    const globalContext: GlobalContext = {
      projectRoot: projectRoot,
      sourceFilePath: file,
      sourceFilePathRelative: file.replace(projectRoot, "."),
      ast: ast,
      services: services,
      typeChecker: typeChecker
    }
    
    concepts = mergeConceptMaps(concepts, unifyConceptMap(traverser.traverse(globalContext), file.replace(globalContext.projectRoot, ".")))
  }

  const endTime = process.hrtime();
  console.log("Finished analyzing project files. Runtime: " + (endTime[0] - startTime[0]) + "s");

  generateGraphs(unifyConceptMap(concepts, "").get("")!);
}

async function generateGraphs(concepts: Map<string, LCEConcept[]>) {
  console.log("Generating graph...")
  const startTime = process.hrtime();
  const driver = neo4jDriver("bolt://localhost:7687", neo4jAuth.basic("", ""));
  const session = driver.session();
  const connectionIndex = new ConnectionIndex();

  try {
    for(let generator of GENERATORS) {
      await generator.run(session, concepts, connectionIndex);
    }
  } finally {
    await session.close();
  }
  await driver.close();
  const endTime = process.hrtime();
  console.log("Finished generating graph. Runtime: " + (endTime[0] - startTime[0]) + "s");
}


processProject("/home/sebastian/dev/master-thesis/example-projects/2multiple");
//processProject("/home/sebastian/dev/master-thesis/example-projects/devhub");
//processProject("/home/sebastian/dev/master-thesis/language-concept-extractor");
