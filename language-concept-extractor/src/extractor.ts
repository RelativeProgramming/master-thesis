import { parseAndGenerateServices } from '@typescript-eslint/typescript-estree';
import * as fs from 'fs';
import * as ts from "typescript";
import { driver as neo4jDriver, auth as neo4jAuth} from "neo4j-driver";
import { Concept } from './concepts';
import { BaseProcessor, SourceData } from './processor';
import ClassDeclarationProcessor from './processors/class-declaration.processor';
import Utils from './utils';
import ClassDeclarationGenerator from './generators/class-declaration.generator';
import TypeScriptProjectFilesGenerator from './generators/typescript-project-files.generator';


const PROCESSORS = [
  ClassDeclarationProcessor
];

const GENERATORS = [
  TypeScriptProjectFilesGenerator,
  ClassDeclarationGenerator
];

function processSourceFile(projectRoot: string, sourceFilePath: string, concepts: Map<Concept, any> = new Map<Concept, any>(), processor: BaseProcessor) {
  const code = fs.readFileSync(sourceFilePath, 'utf8');
  const { ast, services } = parseAndGenerateServices(code, {
    loc: true,
    range: true,
    tokens: true,
    filePath: sourceFilePath,
    project: projectRoot + '/tsconfig.json',
  });
  const typeChecker: ts.TypeChecker = services.program.getTypeChecker();

  const sourceData: SourceData = {
    projectRoot: projectRoot,
    sourceFilePath: sourceFilePath,
    ast: ast,
    services: services,
    typeChecker: typeChecker
  }

  processor.run(sourceData, concepts)
}


export function processProject(projectRoot: string) {
  // TODO: take tsconfig.json into consideration (assumes projectRoot = path that contains tsconfig.json)
  // see https://www.typescriptlang.org/docs/handbook/project-references.html#what-is-a-project-reference
  
  const fileList = Utils.getFileList(projectRoot, [".ts"], [".git", "node_modules"]);

  const concepts: Map<Concept, any> = new Map<Concept, any>();
  concepts.set(Concept.TYPESCRIPT_PROJECT, {
    projectRoot: projectRoot
  });

  console.log("Analyzing " + fileList.length + " project files...");

  let providedConcepts: Concept[] = [Concept.TYPESCRIPT_PROJECT];
  let processors = [...PROCESSORS];
  while(processors.length > 0) {
    for(let Processor of processors) {
      if(!Processor.prototype.requiredConcepts.every((v) => providedConcepts.includes(v)))
        continue
      
      let p = new Processor();
      for (let file of fileList) {
        processSourceFile(projectRoot, file, concepts, p);
      }

      providedConcepts = providedConcepts.concat(p.providedConcepts);
      processors.splice(processors.indexOf(Processor), 1);
    }
  }

  generateGraphs(concepts);

}

async function generateGraphs(concepts: Map<Concept, any>) {
  console.log("Generating Graph...")
  const driver = neo4jDriver("bolt://localhost:7687", neo4jAuth.basic("", ""));
  const session = driver.session();

  try {
    for(let Generator of GENERATORS) {
      const generator = new Generator();
      await generator.run(session, concepts);
    }
  } finally {
    await session.close();
  }
  await driver.close();
}

processProject("/home/sebastian/dev/master-thesis/example-projects/2multiple");