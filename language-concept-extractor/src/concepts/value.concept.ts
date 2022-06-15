import LCEType, { LCETypeParameter } from './type.concept';

/** Base class for all values. */
export default abstract class LCEValue {
    /** 
     * @param type type of the value 
     */
    constructor(public type: LCEType) {}
};

/**
 * Represents a null value (`undefined` or `null`)
 */
export class LCEValueNull extends LCEValue {

    /**
     * @param kind indicates whether value is `undefined` or `null`
     */
    constructor(
        type: LCEType,
        public kind: "undefined" | "null"
    ) {
        super(type);
    }
}

/**
 * Represents a literal value (e.g. `42`, `true` or `"str"`)
 */
export class LCEValueLiteral extends LCEValue {

    /**
     * @param value the value of the literal
     */
    constructor(
        type: LCEType,
        public value: string | number | bigint | boolean | RegExp | null
    ) {
        super(type);
    }
}

/**
 * Represents a declared variable/function/class used as a value (e.g. `myVariable` or `myFunction`)
 */
export class LCEValueDeclared extends LCEValue {

    /**
     * @param fqn fully qualified name of the referenced variable/function/class
     * @param inProject indicates whether reference is declared inside project
     */
    constructor(
        type: LCEType,
        public fqn: string,
        public inProject: boolean,
    ) {
        super(type);
    }
}

/**
 * Represents a member expression (e.g. `myObj.x`)
 */
 export class LCEValueMember extends LCEValue {

    /**
     * @param parent parent value of which a member is accessed
     * @param member member value which is accessed
     */
    constructor(
        type: LCEType,
        public parent: LCEValue,
        public member: LCEValue
    ) {
        super(type);
    }
}

/**
 * Represents a object expression (e.g. `{a: 3, b: "str"}`)
 */
export class LCEValueObject extends LCEValue {

    /**
     * @param members map of the object member's names to their respective values
     */
    constructor(
        type: LCEType,
        public members: Map<string, LCEValue>
    ) {
        super(type);
    }
}

/**
 * Represents a array expression (e.g. `[1, 2, 3]`)
 */
export class LCEValueArray extends LCEValue {

    /**
     * @param items item values of the array
     */
    constructor(
        type: LCEType,
        public items: LCEValue[]
    ) {
        super(type);
    }
}

/**
 * Represents a call expression (e.g. `myArr.concat([4, 5])`)
 */
 export class LCEValueCall extends LCEValue {

    /**
     * @param callee value that is called (e.g. `myArr.concat`)
     * @param args values of the arguments
     * @param typeArgs type arguments specified for call
     */
    constructor(
        type: LCEType,
        public callee: LCEValue,
        public args: LCEValue[],
        public typeArgs: LCEType[]
    ) {
        super(type);
    }
}

/**
 * Represents a function expression (e.g. `function(x: string) { return x.trim(); }`)
 */
export class LCEValueFunction extends LCEValue {}

/**
 * Represents a class expression (e.g. `class A {}`)
 */
 export class LCEValueClass extends LCEValue {}

/**
 * Represents an expression that could not be resolved with other value types
 */
 export class LCEValueComplex extends LCEValue {

    /**
     * @param expression string representation of the value's expression
     */
    constructor(
        type: LCEType,
        public expression: string
    ) {
        super(type);
    }
}
