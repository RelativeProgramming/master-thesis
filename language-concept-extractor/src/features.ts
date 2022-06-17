import { AST_NODE_TYPES } from '@typescript-eslint/types';
import { ClassDeclarationGenerator } from './generators/class-declaration.generator';
import { ConnectionGenerator } from './generators/connection.generator';
import { FunctionDeclarationGenerator } from './generators/function-declaration.generator';
import { InterfaceDeclarationGenerator } from './generators/interface-declaration.generator';
import { TypeScriptProjectFilesGenerator } from './generators/typescript-project-files.generator';
import { Processor } from './processor';
import { ClassDeclarationProcessor } from './processors/class-declaration.processor';
import { DecoratorProcessor } from './processors/decorator.processor';
import { Traverser } from './traverser';
import { ClassDeclarationTraverser } from './traversers/class-declaration.traverser';
import { DecoratorTraverser } from './traversers/decorator.traverser';
import { ExportNamedDeclarationTraverser } from './traversers/export-named-declaration.traverser';
import { IdentifierTraverser } from './traversers/expression.traverser';
import { ProgramTraverser } from './traversers/program.traverser';
import { TypeParameterDeclarationTraverser, TypeParameterInstantiationTraverser, TypeParameterTraverser } from './traversers/type-parameter.traverser';

export const TRAVERSERS: Map<AST_NODE_TYPES, Traverser> = new Map([
    [AST_NODE_TYPES.ClassDeclaration, new ClassDeclarationTraverser()],
    [AST_NODE_TYPES.Decorator, new DecoratorTraverser()],
    [AST_NODE_TYPES.ExportNamedDeclaration, new ExportNamedDeclarationTraverser()],
    [AST_NODE_TYPES.Identifier, new IdentifierTraverser()],
    [AST_NODE_TYPES.Program, new ProgramTraverser()],
    [AST_NODE_TYPES.TSTypeParameter, new TypeParameterTraverser()],
    [AST_NODE_TYPES.TSTypeParameterDeclaration, new TypeParameterDeclarationTraverser()],
    [AST_NODE_TYPES.TSTypeParameterInstantiation, new TypeParameterInstantiationTraverser()],
]);

export const PROCESSORS: Processor[] = [
    new ClassDeclarationProcessor(),
    new DecoratorProcessor(),
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