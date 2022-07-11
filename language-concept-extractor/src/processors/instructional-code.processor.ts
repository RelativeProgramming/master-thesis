import { AST_NODE_TYPES } from '@typescript-eslint/types';

import { ConceptMap, singleEntryConceptMap } from '../concept';
import { LCEDecorator } from '../concepts/decorator.concept';
import { LCEDependency } from '../concepts/dependency.concept';
import { ProcessingContext } from '../context';
import { ExecutionCondition } from '../execution-condition';
import { Processor } from '../processor';
import { DependencyResolutionProcessor } from './dependency-resolution.processor';

export class ScopeProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [
            AST_NODE_TYPES.BlockStatement,
            AST_NODE_TYPES.ForStatement,
            AST_NODE_TYPES.ForInStatement,
            AST_NODE_TYPES.ForOfStatement,
        ],
        () => true
    );

    public override preChildrenProcessing({localContexts}: ProcessingContext): void {
        DependencyResolutionProcessor.addScopeContext(localContexts);
    }
}

export class IdentifierDependencyProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.Identifier],
        ({node}) => false && node.parent?.type !== AST_NODE_TYPES.MemberExpression // TODO: enable
    );

    override postChildrenProcessing({node, localContexts}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        // TODO: exclude declarations etc.
        if(node.type === AST_NODE_TYPES.Identifier) {
            DependencyResolutionProcessor.registerDependency(localContexts, node.name);
        }

        return new Map();
    }
}

// TODO: add dependencies for member expressions