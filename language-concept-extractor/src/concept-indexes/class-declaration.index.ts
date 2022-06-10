import { LCEClassDeclaration } from '../concepts/class-declaration.concept';

export default class LCEClassDeclarationIndex {

    /** maps FQN of a class to the corresponding model object */
    declarations: Map<string, LCEClassDeclaration>;

    constructor() {
        this.declarations = new Map();
    }
}
