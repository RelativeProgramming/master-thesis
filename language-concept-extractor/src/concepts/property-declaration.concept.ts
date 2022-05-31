import { LCEDecorator } from './decorator.concept';
import LCEType from './type.concept';

export interface LCEPropertyDeclaration {
    propertyName: string;
    optional: boolean;
    type: LCEType;
    decorators: LCEDecorator[];
}
