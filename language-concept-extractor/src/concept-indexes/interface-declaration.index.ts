import { LCEInterfaceDeclaration } from '../concepts/interface-declaration.concept';

export class LCEInterfaceDeclarationIndex {

    /** maps FQN of an interface to the corresponding model object */
    declarations: Map<string, LCEInterfaceDeclaration>;

    constructor() {
        this.declarations = new Map();
    }
}
