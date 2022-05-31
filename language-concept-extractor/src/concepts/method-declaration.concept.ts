import { LCEDecorator } from './decorator.concept';
import { LCETypeParameterDeclaration } from './type-parameter.concept';
import LCEType from './type.concept';


export interface LCEMethodDeclaration {
    methodName: string;
    parameters: Map<[number, string], LCEType>;
    returnType: LCEType;
    typeParameters: LCETypeParameterDeclaration[];
    decorators: LCEDecorator[];
}

export interface LCEConstructorDeclaration {
    parameters: Map<[number, string], LCEType>;
}

export interface LCEGetterDeclaration {
    methodName: string;
    returnType: LCEType;
    decorators: LCEDecorator[];
}

export interface LCESetterDeclaration {
    methodName: string;
    parameters: Map<[number, string], LCEType>;
    decorators: LCEDecorator[];
}