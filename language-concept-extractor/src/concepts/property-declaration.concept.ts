import { LCEDecorator } from './decorator.concept';
import LCEType from './type.concept';
import { Visibility } from './visibility.concept';

export interface LCEPropertyDeclaration {
    propertyName: string;
    optional: boolean;
    type: LCEType;
    decorators: LCEDecorator[];
    visibility: Visibility;
    readonly: boolean;
    override?: boolean;
}
