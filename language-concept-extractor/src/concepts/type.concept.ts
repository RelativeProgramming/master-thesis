import { LCETypeParameterDeclaration } from './type-parameter.concept'

/** Base class for all types. */
export default abstract class LCEType {};

/**
 * Represents a primitive type (e.g. `string`)
 */
export class LCETypePrimitive extends LCEType {

    /**
     * @param name identifier of the primitive type
     */
    constructor(
        public name: string
    ) {
        super()
    }
}

/**
 * Represents a type defined by a class, interface or type alias
 */
export class LCETypeDeclared extends LCEType {

    /**
     * @param fqn fully qualified name of a class/interface/type alias
     * @param inProject indicates whether the type has a declaration inside the project
     * @param typeArguments list of type arguments provided for generics
     */
    constructor(
        public fqn: string,
        public inProject: boolean,
        public typeArguments: LCEType[]
    ) {
        super()
    }
}

/**
 * Represents an union type (e.g. `string | number`)
 */
export class LCETypeUnion extends LCEType {

    /**
     * @param types constituents of the union type
     */
    constructor(
        public types: LCEType[]
    ) {
        super()
    }
}

/**
 * Represents an intersection type (e.g. `A & B`)
 */
export class LCETypeIntersection extends LCEType {

    /**
     * @param types constituents of the intersection type
     */
    constructor(
        public types: LCEType[]
    ) {
        super()
    }
}

/**
 * Represents an object type (e.g. `{x: string, y: number}`)
 */
export class LCETypeObject extends LCEType {

    /**
     * @param members members of the object type
     */
    constructor(
        public members: Map<string, LCEType>
    ) {
        super()
    }
}

/**
 * Represents a function type (e.g. `(x: string) => number`)
 */
export class LCETypeFunction extends LCEType {

    /**
     * @param returnType return type of the function
     * @param parameters map of parameter names and their respective types
     */
    constructor(
        public returnType: LCEType,
        public parameters: LCETypeFunctionParameter[],
        public typeParameters: LCETypeParameterDeclaration[]
    ) {
        super()
    }
}

/**
 * Represents a parameter inside a function type (e.g. `x: string` in `(x: string) => number`)
 */
 export class LCETypeFunctionParameter {

    /**
     * @param index position of the parameter in the parameter list
     * @param name name of the parameter
     * @param type type of the parameter
     */
    constructor(
        public index: number,
        public name: string,
        public type: LCEType
    ) { }
}

/**
 * Represents a type was previously declared as type parameter.
 */
export class LCETypeParameter extends LCEType {

    /**
     * @param name name of the type parameter
     */
     constructor(
        public name: string
    ) {
        super()
    }
}

/**
 * Represents a type that could not be parsed correctly.
 */
export class LCETypeNotIdentified extends LCEType {

    /**
     * @param identifier string representation of type that could not successfully parsed
     */
     constructor(
        public identifier: string
    ) {
        super()
    }
}