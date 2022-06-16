import { LCEConcept } from '../concept';

export class LCEDecorator extends LCEConcept {

    public static override conceptId = "decorator";

    constructor(
        public decoratorName: string
    ) {
        super();
    }
}
