import { LCEConcept } from '../concept';
import { LCEType } from './type.concept';
import { LCEValue } from './value.concept';

export class LCEVariableDeclaration extends LCEConcept {
    constructor(
        public variableName: string,
        public kind: "var" | "let" | "const",
        public type: LCEType,
        public initValue: LCEValue | undefined,
        public sourceFilePath: string
    ) {
        super();
    }
}