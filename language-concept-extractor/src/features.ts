import { AST_NODE_TYPES } from '@typescript-eslint/types';
import { ClassDeclarationGenerator } from './generators/class-declaration.generator';
import { ConnectionGenerator } from './generators/connection.generator';
import { FunctionDeclarationGenerator } from './generators/function-declaration.generator';
import { InterfaceDeclarationGenerator } from './generators/interface-declaration.generator';
import { TypeScriptProjectFilesGenerator } from './generators/typescript-project-files.generator';
import { Processor } from './processor';
import { ClassDeclarationProcessor } from './processors/class-declaration.processor';
import { Traverser } from './traverser';
import { ClassDeclarationTraverser } from './traversers/class-declaration.traverser';
import { ExportNamedDeclarationTraverser } from './traversers/export-named-declaration.traverser';
import { ProgramTraverser } from './traversers/program.traverser';

export const TRAVERSERS: Map<AST_NODE_TYPES, Traverser> = new Map([
    [AST_NODE_TYPES.Program, new ProgramTraverser()],
    [AST_NODE_TYPES.ExportNamedDeclaration, new ExportNamedDeclarationTraverser()],
    [AST_NODE_TYPES.ClassDeclaration, new ClassDeclarationTraverser()]
]);

export const PROCESSORS: Processor[] = [
    new ClassDeclarationProcessor()
]

export enum ConceptIndex {
    TYPESCRIPT_PROJECT,
    CLASS_DECLARATIONS,
    INTERFACE_DECLARATIONS,
    FUNCTION_DECLARATIONS,
    VARIABLE_DECLARATIONS
}

export const GENERATORS = [
    TypeScriptProjectFilesGenerator,
    ClassDeclarationGenerator, 
    InterfaceDeclarationGenerator,
    FunctionDeclarationGenerator,
    ConnectionGenerator
];