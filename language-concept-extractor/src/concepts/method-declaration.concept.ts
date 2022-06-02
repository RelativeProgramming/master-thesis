import { LCEDecorator } from './decorator.concept';
import { LCETypeParameterDeclaration } from './type-parameter.concept';
import LCEType from './type.concept';


export interface LCEMethodDeclaration {
    methodName: string;
    parameters: LCEParameterDeclaration[];
    returnType: LCEType;
    typeParameters: LCETypeParameterDeclaration[];
    decorators: LCEDecorator[];
}

export interface LCEParameterDeclaration {
    index: number;
    name: string;
    type: LCEType;
    decorators: LCEDecorator[];
}

export interface LCEConstructorDeclaration {
    parameters: LCEParameterDeclaration[];
}

export interface LCEGetterDeclaration {
    methodName: string;
    returnType: LCEType;
    decorators: LCEDecorator[];
}

export interface LCESetterDeclaration {
    methodName: string;
    parameters: LCEParameterDeclaration[];
    decorators: LCEDecorator[];
}