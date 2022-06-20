import { ConceptMap, mergeConceptMaps, unifyConceptMap } from './concept';
import { ProcessingContext } from './context';
import { Processor, ProcessorMap } from './processor';

export interface TraverserContext {
    parentPropName: string;
    parentPropIndex?: number;
}

/**
 * Used for traversing an AST.
 * Provides context for and executes processors for the current node.
 * Delegates the traversal of any child nodes.
 */
export abstract class Traverser {

    public static readonly LOCAL_TRAVERSER_CONTEXT = "~traverser";

    public traverse(traverserContext: TraverserContext, processingContext: ProcessingContext, processors: ProcessorMap): ConceptMap {
        
        // push new local context
        processingContext.localContexts.pushContexts();

        // add traverser context to local context
        processingContext.localContexts.currentContexts.set(Traverser.LOCAL_TRAVERSER_CONTEXT, traverserContext);


        // find processors for current
        const processorCandidates = processors.get(processingContext.node.type);
        let validProcessors: Processor[] = [];
        if(processorCandidates) {
            validProcessors = processorCandidates.filter(
                (proc) => proc.executionCondition.check(processingContext)
            );
        }

        // pre-processing
        if(validProcessors) {
            for(let proc of validProcessors) {
                proc.preChildrenProcessing(processingContext);
            }
        }

        // process children
        let childConcepts = this.traverseChildren(processingContext, processors);

        // post-processing
        const concepts: ConceptMap[] = [];
        if(validProcessors) {
            for(let proc of validProcessors) {
                concepts.push(proc.postChildrenProcessing(processingContext, childConcepts));
            }
        }

        // reset parentPropNames of childConcepts
        childConcepts = unifyConceptMap(childConcepts, traverserContext.parentPropName);

        // pop local context
        processingContext.localContexts.popContexts();
        
        return mergeConceptMaps(childConcepts, ...concepts);
    }

    public abstract traverseChildren(processingContext: ProcessingContext, processors: ProcessorMap): ConceptMap;
}

export class SimpleTraverser extends Traverser {
    public traverseChildren(processingContext: ProcessingContext, processors: ProcessorMap): ConceptMap {
        return new Map();
    }
}

export function createProcessorMap(processors: Processor[]): ProcessorMap {
    const processorMap: ProcessorMap = new Map();
    for(let proc of processors) {
        for(let nodeType of proc.executionCondition.currentNodeType) {
            const arr = processorMap.get(nodeType);
            if(arr) {
                arr.push(proc);
            } else {
                processorMap.set(nodeType, [proc]);
            }
        }
    }
    return processorMap;
}