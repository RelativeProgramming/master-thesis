import { LCEDecorator } from './decorator.concept';
import { LCEConstructorDeclaration, LCEGetterDeclaration, LCEMethodDeclaration, LCESetterDeclaration } from './method-declaration.concept';
import { LCEPropertyDeclaration } from './property-declaration.concept';
import { LCETypeParameterDeclaration } from './type-parameter.concept';
import { LCETypeDeclared } from './type.concept';

export interface LCEClassDeclaration {
    className: string;
    typeParameters: LCETypeParameterDeclaration[];
    extendsClass: LCETypeDeclared | undefined;
    implementsInterfaces: LCETypeDeclared[];
    constr: LCEConstructorDeclaration | undefined;
    properties: LCEPropertyDeclaration[];
    methods: LCEMethodDeclaration[];
    getters: LCEGetterDeclaration[];
    setters: LCESetterDeclaration[];
    decorators: LCEDecorator[];
    sourceFilePath: string;
}
  