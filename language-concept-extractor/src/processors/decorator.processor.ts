import { AST_NODE_TYPES } from '@typescript-eslint/types';

import { ConceptMap, createMapForConcept } from '../concept';
import { LCEDecorator } from '../concepts/decorator.concept';
import { ProcessingContext } from '../context';
import { ExecutionCondition } from '../execution-rule';
import { Processor } from '../processor';
import { getParentPropName } from '../processor.utils';

export class DecoratorProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.Decorator],
        () => true,
        () => true
    );

    public override postChildrenProcessing({node, localContexts}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.Decorator) {
            if(node.expression.type === AST_NODE_TYPES.Identifier) {
                const decorator = new LCEDecorator(node.expression.name);
                return createMapForConcept(getParentPropName(localContexts), LCEDecorator.conceptId, decorator);
            }
        }
        return new Map();
    }
    
}