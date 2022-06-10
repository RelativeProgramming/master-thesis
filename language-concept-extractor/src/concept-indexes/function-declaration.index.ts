import { LCEFunctionDeclaration } from '../concepts/function-declaration.concept';

export default class LCEFunctionDeclarationIndex {

    /** maps FQN of a function to the corresponding model object */
    declarations: Map<string, LCEFunctionDeclaration>;

    constructor() {
        this.declarations = new Map();
    }
}
