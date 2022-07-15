import { AST_NODE_TYPES } from '@typescript-eslint/types';

import { ConceptMap, singleEntryConceptMap } from '../concept';
import { LCEDecorator } from '../concepts/decorator.concept';
import { ProcessingContext } from '../context';
import { ExecutionCondition } from '../execution-condition';
import { Processor } from '../processor';
import { getAndDeleteAllValueChildConcepts } from '../processor.utils';
import { DecoratorTraverser } from '../traversers/decorator.traverser';
import { VALUE_PROCESSING_FLAG } from './value.processor';

export class DecoratorProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.Decorator],
        () => true
    );

    public override preChildrenProcessing({localContexts}: ProcessingContext): void {
        localContexts.currentContexts.set(VALUE_PROCESSING_FLAG, true);
    }

    public override postChildrenProcessing({node, localContexts}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.Decorator) {
            const expressions = getAndDeleteAllValueChildConcepts(DecoratorTraverser.EXPRESSION_PROP, childConcepts);
            if(expressions.length === 1) {
                const decorator = new LCEDecorator(expressions[0]);
                return singleEntryConceptMap(LCEDecorator.conceptId, decorator);
            }
        }
        return new Map();
    }
    
}