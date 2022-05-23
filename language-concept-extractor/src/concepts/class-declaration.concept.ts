
export default class ClassDeclarationIndex {

    /** maps FQN of class to the corresponding model object */
    declarations: Map<string, Class>;

    constructor() {
        this.declarations = new Map();
    }
}

export interface Class {
    className: string;
    sourceFilePath: string;
    fields: Field[];
    methods: Method[];
    exported_name: string | undefined;
}

export interface Field {
    name: string;
}

export interface Method {
    name: string
}