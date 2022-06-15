import LCEType from './type.concept';
import LCEValue from './value.concept';

export interface LCEVariableDeclaration {
    variableName: string;
    kind: "var" | "let" | "const";
    type: LCEType;
    initValue: LCEValue | undefined;
    sourceFilePath: string;
}