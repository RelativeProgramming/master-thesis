import { ConceptMap, mergeConceptMaps, unifyConceptMap } from './concept';
import { ProcessingContext } from './context';
import { Processor, ProcessorMap } from './processor';

export interface TraverserContext {
    parentPropName: string;
    parentPropIndex?: number;
}

export abstract class Traverser {

    public static readonly LOCAL_TRAVERSER_CONTEXT = "~traverser";

    public traverse(traverserContext: TraverserContext, processingContext: ProcessingContext, processors: ProcessorMap): ConceptMap {
        const processorCandidates = processors.get(processingContext.node.type);
        let validProcessors: Processor[] = [];
        if(processorCandidates) {
            validProcessors = processorCandidates.filter(
                (proc) => proc.executionCondition.nodeTypeCheck(processingContext.node) &&
                    proc.executionCondition.contextCheck(processingContext.globalContext, processingContext.localContexts)
            );
        }

        // push new local context
        processingContext.localContexts.pushContexts();

        // add traverser context to local context
        processingContext.localContexts.currentContexts.set(Traverser.LOCAL_TRAVERSER_CONTEXT, traverserContext);

        // pre-processing
        if(validProcessors) {
            for(let proc of validProcessors) {
                proc.preChildrenProcessing(processingContext);
            }
        }

        // process children
        let childConcepts = this.processChildren(processingContext, processors);

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

    public abstract processChildren(processingContext: ProcessingContext, processors: ProcessorMap): ConceptMap;
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
