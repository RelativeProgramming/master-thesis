import { LCEDecorator } from './decorator.concept';
import { LCEConstructorDeclaration, LCEGetterDeclaration, LCEMethodDeclaration, LCESetterDeclaration } from './method-declaration.concept';
import { LCEPropertyDeclaration } from './property-declaration.concept';
import { LCETypeParameterDeclaration } from './type-parameter.concept';
import { LCETypeDeclared } from './type.concept';

export interface LCEInterfaceDeclaration {
    interfaceName: string;
    typeParameters: LCETypeParameterDeclaration[];
    extendsInterfaces: LCETypeDeclared[];
    properties: LCEPropertyDeclaration[];
    methods: LCEMethodDeclaration[];
    getters: LCEGetterDeclaration[];
    setters: LCESetterDeclaration[];
    sourceFilePath: string;
}
  