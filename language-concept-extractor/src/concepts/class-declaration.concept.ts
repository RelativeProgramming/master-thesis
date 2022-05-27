import { LCEDecorator } from './decorator.concept';
import { LCEMethodDeclaration } from './method-declaration.concept';
import { LCEPropertyDeclaration } from './property-declaration.concept';


export default class ClassDeclarationIndex {

    /** maps FQN of class to the corresponding model object */
    declarations: Map<string, LCEClassDeclaration>;

    constructor() {
        this.declarations = new Map();
    }
}

export interface LCEClassDeclaration {
    className: string;
    properties: LCEPropertyDeclaration[];
    methods: LCEMethodDeclaration[];
    decorators: LCEDecorator[];
    sourceFilePath: string;
}
  