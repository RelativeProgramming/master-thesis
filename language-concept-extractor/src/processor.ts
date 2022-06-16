import { LCEConcept } from './concept';
import { ProcessingContext } from './context';
import { ExecutionCondition } from './execution-rule';

export abstract class Processor {

    /** 
     * defines on what nodes and in which context the processor is executed
     */
    public abstract executionCondition: ExecutionCondition;

    /**
     * Function that is executed before the children of the current AST node are processed.
     * Use to setup the context and/or add local processors by returning them.
     */
    public preChildrenProcessing(context: ProcessingContext): Processor[] { 
        return []; 
    }

    /**
     * Function that is executed after the children of the current AST node have been processed.
     * Use to integrate concepts generated for child nodes.
     * 
     * NOTE: Remove child concepts from the Map, if they are no longer needed further up the tree!
     * 
     * @returns new concept(s) created for the current node
     */
    public postChildrenProcessing(
        processingContext: ProcessingContext, 
        childConcepts: Map<string, LCEConcept[]>
    ): Map<string, LCEConcept[]> {
        return childConcepts;
    }

}
