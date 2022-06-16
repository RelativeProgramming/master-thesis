import { LCEConcept } from '../concept';
import { LCEType } from './type.concept';

/**
 * Represents a type variable declared by a function or class (e.g. the `T` in `<T>(x: T) => T[]`)
 */
 export class LCETypeParameterDeclaration extends LCEConcept{

    /**
     * @param name name of type variable
     * @param constraint type of the constraint on the type variable
     */
    constructor(
        public name: string,
        public constraint: LCEType
    ) {
        super();
    }
}