import { AST_NODE_TYPES } from '@typescript-eslint/types';
import { ConceptMap } from '../concept';
import { ProcessingContext } from '../context';
import { ProcessorMap, Traverser } from '../traverser';
import { runTraverserForNodes } from '../traverser.utils';

export class ProgramTraverser extends Traverser {

    public processChildren(processingContext: ProcessingContext, processors: ProcessorMap): ConceptMap {
        const {node} = processingContext;
        
        if(node.type === AST_NODE_TYPES.Program) {
            return runTraverserForNodes(node.body, processingContext, processors) ?? new Map();
        }

        return new Map();
    }

}