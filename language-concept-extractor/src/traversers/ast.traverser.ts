import { AST_NODE_TYPES } from '@typescript-eslint/types';
import { ConceptMap } from '../concept';
import { GlobalContext, LocalContexts } from '../context';
import { PROCESSORS } from '../features';
import { Processor } from '../processor';
import { createProcessorMap } from '../traverser';
import { runTraverserForNode } from '../traverser.utils';


export class AstTraverser {

    /** optimized data structure for retrieving all processor for a specific AST node type */
    private processorMap: Map<AST_NODE_TYPES, Processor[]>;

    constructor(
    ) {
        this.processorMap = createProcessorMap(PROCESSORS);
    }

    public traverse(globalContext: GlobalContext): ConceptMap {

        const conceptMap = runTraverserForNode(globalContext.ast, {
            globalContext: globalContext,
            localContexts: new LocalContexts(),
            node: globalContext.ast
        }, this.processorMap) ?? new Map();

        return conceptMap;
    }

}