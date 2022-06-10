import { LCEDecorator } from './decorator.concept';
import { LCEPropertyDeclaration } from './property-declaration.concept';
import { LCETypeParameterDeclaration } from './type-parameter.concept';
import LCEType from './type.concept';
import { Visibility } from './visibility.concept';


export interface LCEMethodDeclaration {
    methodName: string;
    parameters: LCEParameterDeclaration[];
    returnType: LCEType;
    typeParameters: LCETypeParameterDeclaration[];
    decorators: LCEDecorator[];
    visibility: Visibility;
    override?: boolean;
}

export interface LCEParameterDeclaration {
    index: number;
    name: string;
    type: LCEType;
    optional: boolean;
    decorators: LCEDecorator[];
}

export interface LCEConstructorDeclaration {
    parameters: LCEParameterDeclaration[];

    /** maps parameter index numbers to declared parameter properties */
    parameterProperties: Map<number, LCEPropertyDeclaration>;
}

export interface LCEGetterDeclaration {
    methodName: string;
    returnType: LCEType;
    decorators: LCEDecorator[];
    visibility: Visibility;
    override?: boolean;
}

export interface LCESetterDeclaration {
    methodName: string;
    parameters: LCEParameterDeclaration[];
    decorators: LCEDecorator[];
    visibility: Visibility;
    override?: boolean;
}