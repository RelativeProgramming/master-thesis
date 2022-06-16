
/**
 * Base class for all language concepts.
 */
export abstract class LCEConcept {
    /** 
     * Unique identifier for a concept class. 
     * Should be set by subclasses. 
     */
    public static conceptId: string;
}

export type ConceptMap = Map<string, LCEConcept[]>;