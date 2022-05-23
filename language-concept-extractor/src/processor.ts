import { ParserServices } from '@typescript-eslint/parser';
import { AST } from '@typescript-eslint/typescript-estree';
import { TypeChecker } from 'typescript';
import { Concept } from './concepts';

/** super class to all Processors */
export interface BaseProcessor {

    /** previously extracted Concepts required by the Processor */
    requiredConcepts: Array<Concept>;

    /** new Concepts proviced by the Processor */
    providedConcepts: Array<Concept>;

    /** extracts new Concepts from source data and other previously extracted Concepts */
    run(sourceData: SourceData, concepts: Map<Concept, any>): void;
}

/** describes basic data structures provided to all Processors */
export interface SourceData {
    projectRoot: string,
    sourceFilePath: string,
    ast: AST<{
        filePath: string;
        loc: true;
        project: string;
        tsconfigRootDir: string;
        range: true;
    }>;
    services: ParserServices;
    typeChecker: TypeChecker;
}