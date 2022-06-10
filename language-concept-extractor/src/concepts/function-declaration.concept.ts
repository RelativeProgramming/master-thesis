import { LCEParameterDeclaration } from './method-declaration.concept';
import { LCETypeParameterDeclaration } from './type-parameter.concept';
import LCEType from './type.concept';

export interface LCEFunctionDeclaration {
    functionName: string;
    parameters: LCEParameterDeclaration[];
    returnType: LCEType;
    typeParameters: LCETypeParameterDeclaration[];
    sourceFilePath: string;
}
    