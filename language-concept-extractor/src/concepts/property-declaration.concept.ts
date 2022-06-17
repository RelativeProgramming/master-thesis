import { LCEConcept } from '../concept';
import { LCEDecorator } from './decorator.concept';
import { LCEType } from './type.concept';
import { Visibility } from './visibility.concept';

export class LCEPropertyDeclaration extends LCEConcept {

    public static override conceptId = "property-declaration";

    constructor(
        public propertyName: string,
        public optional: boolean,
        public type: LCEType,
        public decorators: LCEDecorator[],
        public visibility: Visibility,
        public readonly: boolean,
        public override?: boolean
    ) {
        super();
    }
}
