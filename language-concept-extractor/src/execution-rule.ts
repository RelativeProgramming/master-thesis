import { AST_NODE_TYPES } from '@typescript-eslint/types';
import { Node } from '@typescript-eslint/types/dist/generated/ast-spec';
import { GlobalContext, LocalContexts } from './context';

/**
 * Represents the condition under which a `Processor` is executed.
 */
export class ExecutionCondition {

    /** Condition that never returns true */
    static readonly NEVER: ExecutionCondition = new ExecutionCondition([], () => false, () => false);

    /**
     * Creates new ExecutionCondition
     * @param currentNodeType 1. Check: types of the current node on which the condition shall be checked
     * @param nodeTypeCheck 2. Check: function to perform advanced checks on the node involving parent/sibling nodes, etc.
     * @param contextCheck 3. Check: function to perform checks on the global and local contexts
     */
    constructor(
        public currentNodeType: AST_NODE_TYPES[],
        public nodeTypeCheck: (currentNode: Node) => boolean,
        public contextCheck: (globalContext: GlobalContext, localContexts: LocalContexts) => boolean
    ) {}

}