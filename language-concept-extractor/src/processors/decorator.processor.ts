import { AST_NODE_TYPES } from '@typescript-eslint/types';

import { ConceptMap, createConceptMap } from '../concept';
import { LCEDecorator } from '../concepts/decorator.concept';
import { ProcessingContext } from '../context';
import { ExecutionCondition } from '../execution-rule';
import { Processor } from '../processor';

export class DecoratorProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.Decorator],
        () => true
    );

    public override postChildrenProcessing({node, localContexts}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.Decorator) {
            if(node.expression.type === AST_NODE_TYPES.Identifier) {
                const decorator = new LCEDecorator(node.expression.name);
                return createConceptMap(LCEDecorator.conceptId, decorator);
            }
            // TODO: implement decorator call pattern
        }
        return new Map();
    }
    
}