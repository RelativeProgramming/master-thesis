import { parseAndGenerateServices } from '@typescript-eslint/typescript-estree';
import * as fs from 'fs';
import * as ts from "typescript";
import { Concept } from './concepts';
import { BaseProcessor, SourceData } from './processor';
import ClassDeclarationProcessor from './processors/class-declaration.processor';
import Utils from './utils';


const PROCESSORS = [ClassDeclarationProcessor]

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

  for(let Processor of PROCESSORS) {
    let p = new Processor();
    for (let file of fileList) {
      processSourceFile(projectRoot, file, concepts, p);
    }
  }

  console.log("Finished analyzing project");
}

processProject("/home/sebastian/dev/master-thesis/example-projects/2multiple");
