import { LCEConcept, LCENamedConcept } from '../concept';
import { LCEDecorator } from './decorator.concept';
import { LCEPropertyDeclaration } from './property-declaration.concept';
import { LCETypeParameterDeclaration } from './type-parameter.concept';
import { LCEType } from './type.concept';
import { Visibility } from './visibility.concept';


export class LCEMethodDeclaration extends LCENamedConcept {

    public static override conceptId = "method-declaration";

    constructor(
        public methodName: string,
        fqn: string,
        public parameters: LCEParameterDeclaration[],
        public returnType: LCEType,
        public typeParameters: LCETypeParameterDeclaration[],
        public decorators: LCEDecorator[],
        public visibility: Visibility,
        public override?: boolean
    ) {
        super(fqn);
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

export class LCEParameterPropertyDeclaration extends LCEPropertyDeclaration {
    public static override conceptId = "parameter-property-declaration";

    constructor(
        public index: number,
        propertyName: string,
        fqn: string,
        optional: boolean,
        type: LCEType,
        decorators: LCEDecorator[],
        visibility: Visibility,
        readonly: boolean,
        override?: boolean
    ) {
        super(
            propertyName,
            fqn,
            optional,
            type,
            decorators,
            visibility,
            readonly,
            override
        );
    }
}

export class LCEConstructorDeclaration extends LCENamedConcept {

    public static override conceptId = "constructor-declaration";

    /**
     * @param parameterProperties maps parameter index numbers to declared parameter properties
     */
    constructor(
        fqn: string,
        public parameters: LCEParameterDeclaration[],
        public parameterProperties: LCEParameterPropertyDeclaration[]
    ) {
        super(fqn);
    }
}

export class LCEGetterDeclaration extends LCENamedConcept {

    public static override conceptId = "getter-declaration";

    constructor(
        public methodName: string,
        fqn: string,
        public returnType: LCEType,
        public decorators: LCEDecorator[],
        public visibility: Visibility,
        public override?: boolean
    ) {
        super(fqn);
    }
}

export class LCESetterDeclaration extends LCENamedConcept {

    public static override conceptId = "setter-declaration";

    constructor(
        public methodName: string,
        fqn: string,
        public parameters: LCEParameterDeclaration[],
        public decorators: LCEDecorator[],
        public visibility: Visibility,
        public override?: boolean
    ) {
        super(fqn);
    }
}