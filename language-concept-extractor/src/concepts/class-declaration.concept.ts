import { LCEDecorator } from './decorator.concept';
import { LCEConstructorDeclaration, LCEGetterDeclaration, LCEMethodDeclaration, LCESetterDeclaration } from './method-declaration.concept';
import { LCEPropertyDeclaration } from './property-declaration.concept';
import { LCETypeParameterDeclaration } from './type-parameter.concept';


export default class ClassDeclarationIndex {

    /** maps FQN of class to the corresponding model object */
    declarations: Map<string, LCEClassDeclaration>;

    constructor() {
        this.declarations = new Map();
    }
}

export interface LCEClassDeclaration {
    className: string;
    typeParameters: LCETypeParameterDeclaration[];
    constr: LCEConstructorDeclaration | undefined;
    properties: LCEPropertyDeclaration[];
    methods: LCEMethodDeclaration[];
    getters: LCEGetterDeclaration[];
    setters: LCESetterDeclaration[];
    decorators: LCEDecorator[];
    sourceFilePath: string;
}
  