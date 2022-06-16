import { LCEConcept } from '../concept';
import { LCEGetterDeclaration, LCEMethodDeclaration, LCESetterDeclaration } from './method-declaration.concept';
import { LCEPropertyDeclaration } from './property-declaration.concept';
import { LCETypeParameterDeclaration } from './type-parameter.concept';
import { LCETypeDeclared } from './type.concept';

export class LCEInterfaceDeclaration extends LCEConcept {
    constructor(
        public interfaceName: string,
        public typeParameters: LCETypeParameterDeclaration[],
        public extendsInterfaces: LCETypeDeclared[],
        public properties: LCEPropertyDeclaration[],
        public methods: LCEMethodDeclaration[],
        public getters: LCEGetterDeclaration[],
        public setters: LCESetterDeclaration[],
        public sourceFilePath: string
    ) {
        super();
    }
}
  