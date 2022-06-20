import { AST_NODE_TYPES } from '@typescript-eslint/types';

import { Generator } from './generator';
import { ClassDeclarationGenerator } from './generators/class-declaration.generator';
import { ConnectionGenerator } from './generators/connection.generator';
import { FunctionDeclarationGenerator } from './generators/function-declaration.generator';
import { InterfaceDeclarationGenerator } from './generators/interface-declaration.generator';
import { TypeScriptProjectFilesGenerator } from './generators/typescript-project-files.generator';
import { Processor } from './processor';
import { ClassDeclarationProcessor, ImplementsDeclarationProcessor, SuperClassDeclarationProcessor } from './processors/class-declaration.processor';
import { MethodParameterProcessor, MethodProcessor, PropertyProcessor } from './processors/class-like-declaration.processor';
import { DecoratorProcessor } from './processors/decorator.processor';
import { Traverser } from './traverser';
import { ClassDeclarationTraverser, ClassImplementsTraverser } from './traversers/class-declaration.traverser';
import { DecoratorTraverser } from './traversers/decorator.traverser';
import { ExportNamedDeclarationTraverser } from './traversers/export-named-declaration.traverser';
import { IdentifierTraverser } from './traversers/expression.traverser';
import { MethodDefinitionTraverser, MethodParameterPropertyTraverser, MethodSignatureTraverser } from './traversers/method.traverser';
import { ProgramTraverser } from './traversers/program.traverser';
import { PropertyDeclarationTraverser } from './traversers/property.traverser';
import { TypeParameterDeclarationTraverser, TypeParameterInstantiationTraverser, TypeParameterTraverser } from './traversers/type-parameter.traverser';

export const TRAVERSERS: Map<AST_NODE_TYPES, Traverser> = new Map([
    [AST_NODE_TYPES.ClassDeclaration, new ClassDeclarationTraverser()],
    [AST_NODE_TYPES.Decorator, new DecoratorTraverser()],
    [AST_NODE_TYPES.ExportNamedDeclaration, new ExportNamedDeclarationTraverser()],
    [AST_NODE_TYPES.Identifier, new IdentifierTraverser()],
    [AST_NODE_TYPES.MethodDefinition, new MethodDefinitionTraverser()],
    [AST_NODE_TYPES.Program, new ProgramTraverser()],
    [AST_NODE_TYPES.PropertyDefinition, new PropertyDeclarationTraverser()],
    [AST_NODE_TYPES.TSClassImplements, new ClassImplementsTraverser()],
    [AST_NODE_TYPES.TSMethodSignature, new MethodSignatureTraverser()],
    [AST_NODE_TYPES.TSParameterProperty, new MethodParameterPropertyTraverser()],
    [AST_NODE_TYPES.TSPropertySignature, new PropertyDeclarationTraverser()],
    [AST_NODE_TYPES.TSTypeParameter, new TypeParameterTraverser()],
    [AST_NODE_TYPES.TSTypeParameterDeclaration, new TypeParameterDeclarationTraverser()],
    [AST_NODE_TYPES.TSTypeParameterInstantiation, new TypeParameterInstantiationTraverser()],
]);

export const PROCESSORS: Processor[] = [
    new ClassDeclarationProcessor(),
    new DecoratorProcessor(),
    new ImplementsDeclarationProcessor(),
    new MethodParameterProcessor(),
    new MethodProcessor(),
    new PropertyProcessor(),
    new SuperClassDeclarationProcessor(),
]

export const GENERATORS: Generator[] = [
    new TypeScriptProjectFilesGenerator(),
    new ClassDeclarationGenerator(), 
    new InterfaceDeclarationGenerator(),
    new FunctionDeclarationGenerator(),
    new ConnectionGenerator()
];