import { LCEDecorator } from './decorator.concept';


export interface LCEMethodDeclaration {
    methodName: string
    decorators: LCEDecorator[];
}
