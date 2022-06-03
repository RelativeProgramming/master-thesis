import LCEType from './type.concept';

/**
 * Represents a type variable declared by a function or class (e.g. the `T` in `<T>(x: T) => T[]`)
 */
 export class LCETypeParameterDeclaration {

    /**
     * @param name name of type variable
     * @param constraint type of the constraint on the type variable
     */
    constructor(
        public name: string,
        public constraint: LCEType
    ) {}
}