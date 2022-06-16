import { AST_NODE_TYPES } from '@typescript-eslint/types';
import { ConceptMap } from './concept';
import { GlobalContext, LocalContexts, ProcessingContext } from './context';
import { PROCESSORS } from './features';
import { Processor } from './processor';
import { Utils } from './utils';

export type ProcessorMap = Map<AST_NODE_TYPES, Processor[]>;

export abstract class Traverser {

    public traverse(processingContext: ProcessingContext, processors: ProcessorMap): ConceptMap {
        const processorCandidates = processors.get(processingContext.node.type);
        let validProcessors: Processor[] = [];
        if(processorCandidates) {
            validProcessors = processorCandidates.filter(
                (proc) => proc.executionCondition.nodeTypeCheck(processingContext.node) &&
                    proc.executionCondition.contextCheck(processingContext.globalContext, processingContext.localContexts)
            );
        }
        
        let localProcessors: Processor[] = [];

        // push local contexts
        processingContext.localContexts.pushContexts();

        // pre-processing + adding local processors
        if(validProcessors) {
            for(let proc of validProcessors) {
                localProcessors = localProcessors.concat(proc.preChildrenProcessing(processingContext));
            }
        }
        let childProcessors = processors;
        if(localProcessors.length > 0) {
            childProcessors = Utils.mergeArrayMaps(processors, createProcessorMap(localProcessors));
        }

        // process children
        const childConcepts = this.processChildren(processingContext, childProcessors);

        // post-processing
        const concepts: ConceptMap[] = [];
        if(validProcessors) {
            for(let proc of validProcessors) {
                concepts.push(proc.postChildrenProcessing(processingContext, childConcepts));
            }
        }

        // pop local contexts
        processingContext.localContexts.popContexts();
        
        return Utils.mergeArrayMaps(childConcepts, ...concepts);
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
