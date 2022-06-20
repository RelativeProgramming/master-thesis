import { LCEConcept } from '../concept';
import { LCEDecorator } from './decorator.concept';
import { LCEConstructorDeclaration, LCEGetterDeclaration, LCEMethodDeclaration, LCESetterDeclaration } from './method-declaration.concept';
import { LCEPropertyDeclaration } from './property-declaration.concept';
import { LCETypeParameterDeclaration } from './type-parameter.concept';
import { LCETypeDeclared } from './type.concept';

export class LCEClassDeclaration extends LCEConcept {

    public static override conceptId = "class-declaration";

    constructor(
        public className: string,
        public fqn: string,
        public typeParameters: LCETypeParameterDeclaration[],
        public extendsClass: LCETypeDeclared | undefined,
        public implementsInterfaces: LCETypeDeclared[],
        public constr: LCEConstructorDeclaration | undefined,
        public properties: LCEPropertyDeclaration[],
        public methods: LCEMethodDeclaration[],
        public getters: LCEGetterDeclaration[],
        public setters: LCESetterDeclaration[],
        public decorators: LCEDecorator[],
        public sourceFilePath: string
    ) {super();}
}
  