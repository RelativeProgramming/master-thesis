import { LCEConcept } from '../concept';
import { LCEDecorator } from './decorator.concept';
import { LCEPropertyDeclaration } from './property-declaration.concept';
import { LCETypeParameterDeclaration } from './type-parameter.concept';
import { LCEType } from './type.concept';
import { Visibility } from './visibility.concept';


export class LCEMethodDeclaration extends LCEConcept {

    public static override conceptId = "method-declaration";

    constructor(
        public methodName: string,
        public parameters: LCEParameterDeclaration[],
        public returnType: LCEType,
        public typeParameters: LCETypeParameterDeclaration[],
        public decorators: LCEDecorator[],
        public visibility: Visibility,
        public override?: boolean
    ) {
        super();
    }
}

export class LCEParameterDeclaration extends LCEConcept {

    public static override conceptId = "parameter-declaration";

    constructor(
        public index: number,
        public name: string,
        public type: LCEType,
        public optional: boolean,
        public decorators: LCEDecorator[]
    ) {
        super();
    }
}

export class LCEConstructorDeclaration extends LCEConcept {

    public static override conceptId = "constructor-declaration";

    /**
     * @param parameterProperties maps parameter index numbers to declared parameter properties
     */
    constructor(
        public parameters: LCEParameterDeclaration[],
        public parameterProperties: Map<number, LCEPropertyDeclaration>
    ) {
        super();
    }
}

export class LCEGetterDeclaration extends LCEConcept {

    public static override conceptId = "getter-declaration";

    constructor(
        public methodName: string,
        public returnType: LCEType,
        public decorators: LCEDecorator[],
        public visibility: Visibility,
        public override?: boolean
    ) {
        super();
    }
}

export class LCESetterDeclaration extends LCEConcept {

    public static override conceptId = "setter-declaration";

    constructor(
        public methodName: string,
        public parameters: LCEParameterDeclaration[],
        public decorators: LCEDecorator[],
        public visibility: Visibility,
        public override?: boolean
    ) {
        super();
    }
}