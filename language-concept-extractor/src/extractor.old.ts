import { parseAndGenerateServices } from '@typescript-eslint/typescript-estree';
import * as fs from 'fs';
import * as ts from "typescript";

const code = fs.readFileSync('/home/sebastian/dev/master-thesis/example-projects/1simple/example-program1.ts', 'utf8');
const { ast, services } = parseAndGenerateServices(code, {
  filePath: '/home/sebastian/dev/master-thesis/example-projects/1simple/example-program1.ts',
  loc: true,
  range: true,
  tokens: true,
  project: '/home/sebastian/dev/master-thesis/example-projects/1simple/tsconfig.json',
  tsconfigRootDir: module.path,
  
});

//let nativeNode = services.esTreeNodeToTSNodeMap.get(ast.body[0].body!.body![2]);
const checker: ts.TypeChecker = services.program.getTypeChecker();
let n = services.esTreeNodeToTSNodeMap.get(ast.body[0]);
let x = checker.getTypeAtLocation(n);

console.log(checker.typeToString(x));
for(const prop of x.getProperties()) {
  console.log("\t"+checker.typeToString(checker.getTypeOfSymbolAtLocation(prop, n)))
}



// ===============================================================================

// import * as ts from "typescript";
// import { inspect } from 'util'

// // relative to your root
// const files: string[] = ['/home/sebastian/dev/master-thesis/ast-extraction/example-program1.ts']
// const program: ts.Program = ts.createProgram(files, {});
// const checker: ts.TypeChecker = program.getTypeChecker();

// const myComponentSourceFile = program.getSourceFile(files[0])!;

// console.log(inspect(myComponentSourceFile));

// ts.forEachChild(myComponentSourceFile, node => {
//   node
//   // let x = checker.getTypeAtLocation(node);
//   // if(ts.isClassDeclaration(node)) {
//   //   // get symbol for class
//   //   let symbol = checker.getSymbolAtLocation(node.name!)!;
    
//   //   ts.forEachChild(node, node2 => {
//   //     let y = checker.getTypeAtLocation(node.name!);
//   //     console.log(y);
//   //   });
    
//   // }
// });
