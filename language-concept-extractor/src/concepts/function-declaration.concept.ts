import { LCEConcept } from '../concept';
import { LCEParameterDeclaration } from './method-declaration.concept';
import { LCETypeParameterDeclaration } from './type-parameter.concept';
import { LCEType } from './type.concept';

export class LCEFunctionDeclaration extends LCEConcept{

    public static override conceptId = "function-declaration";

    constructor(
        public functionName: string,
        public parameters: LCEParameterDeclaration[],
        public returnType: LCEType,
        public typeParameters: LCETypeParameterDeclaration[],
        public sourceFilePath: string
    ) {
        super();
    }
}
    