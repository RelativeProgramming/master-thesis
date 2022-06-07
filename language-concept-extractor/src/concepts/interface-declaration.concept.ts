import { LCEDecorator } from './decorator.concept';
import { LCEConstructorDeclaration, LCEGetterDeclaration, LCEMethodDeclaration, LCESetterDeclaration } from './method-declaration.concept';
import { LCEPropertyDeclaration } from './property-declaration.concept';
import { LCETypeParameterDeclaration } from './type-parameter.concept';


export default class LCEInterfaceDeclarationIndex {

    /** maps FQN of an interface to the corresponding model object */
    declarations: Map<string, LCEInterfaceDeclaration>;

    constructor() {
        this.declarations = new Map();
    }
}

export interface LCEInterfaceDeclaration {
    interfaceName: string;
    typeParameters: LCETypeParameterDeclaration[];
    properties: LCEPropertyDeclaration[];
    methods: LCEMethodDeclaration[];
    getters: LCEGetterDeclaration[];
    setters: LCESetterDeclaration[];
    sourceFilePath: string;
}
  