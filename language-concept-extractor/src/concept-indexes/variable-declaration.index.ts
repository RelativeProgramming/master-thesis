import { LCEVariableDeclaration } from '../concepts/variable-declaration.concept';

export class LCEVariableDeclarationIndex {

    /** maps FQN of a variable to the corresponding model object */
    declarations: Map<string, LCEVariableDeclaration>;

    constructor() {
        this.declarations = new Map();
    }
}
