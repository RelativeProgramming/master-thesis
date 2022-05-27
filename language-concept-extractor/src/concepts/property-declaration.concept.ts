import { LCEDecorator } from './decorator.concept';

export interface LCEPropertyDeclaration {
    propertyName: string;
    optional: boolean;
    decorators: LCEDecorator[];
}
