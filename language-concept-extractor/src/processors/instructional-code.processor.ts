import { AST_NODE_TYPES } from '@typescript-eslint/types';
import { Identifier, Literal } from '@typescript-eslint/types/dist/generated/ast-spec';

import { ConceptMap } from '../concept';
import { LCETypeDeclared } from '../concepts/type.concept';
import { ProcessingContext } from '../context';
import { ExecutionCondition } from '../execution-condition';
import { Processor } from '../processor';
import { getParentPropName } from '../processor.utils';
import { ArrowFunctionExpressionTraverser, MemberExpressionTraverser, TaggedTemplateExpressionTraverser } from '../traversers/expression.traverser';
import { FunctionTraverser } from '../traversers/function.traverser';
import { MethodTraverser } from '../traversers/method.traverser';
import { PropertyTraverser } from '../traversers/property.traverser';
import { DependencyResolutionProcessor } from './dependency-resolution.processor';
import { parseESNodeType } from './type.utils';

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
        ({node, localContexts}) => 
            !((node.parent?.type === AST_NODE_TYPES.MethodDefinition || node.parent?.type === AST_NODE_TYPES.TSMethodSignature) && (getParentPropName(localContexts) === MethodTraverser.KEY_PROP || getParentPropName(localContexts) === MethodTraverser.PARAMETERS_PROP)) &&
            !((node.parent?.type === AST_NODE_TYPES.PropertyDefinition || node.parent?.type === AST_NODE_TYPES.TSPropertySignature) && getParentPropName(localContexts) === PropertyTraverser.KEY_PROP) &&
            !((node.parent?.type === AST_NODE_TYPES.FunctionDeclaration || node.parent?.type === AST_NODE_TYPES.TSDeclareFunction || node.parent?.type === AST_NODE_TYPES.FunctionExpression) && getParentPropName(localContexts) === FunctionTraverser.PARAMETERS_PROP) &&
            !(node.parent?.type === AST_NODE_TYPES.ArrowFunctionExpression && getParentPropName(localContexts) === ArrowFunctionExpressionTraverser.PARAMETERS_PROP) &&
            !(node.parent?.type === AST_NODE_TYPES.TaggedTemplateExpression && getParentPropName(localContexts) === TaggedTemplateExpressionTraverser.TAG_PROP) &&
            !(node.parent?.type === AST_NODE_TYPES.MemberExpression && getParentPropName(localContexts) === MemberExpressionTraverser.PROPERTY_PROP) &&
            node.parent?.type !== AST_NODE_TYPES.ArrayPattern &&
            node.parent?.type !== AST_NODE_TYPES.ObjectPattern &&
            node.parent?.type !== AST_NODE_TYPES.ImportExpression
    );


    override postChildrenProcessing({node, localContexts}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.Identifier) {
            DependencyResolutionProcessor.registerDependency(localContexts, node.name);
        }

        return new Map();
    }
}

/**
 * Processes member expressions and adds appropriate dependencies.
 * Only processes identifier and direct literal property accesses.
 * Adds dependencies for all type member accesses.
 */
export class MemberExpressionDependencyProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.MemberExpression],
        () => true
    );

    override postChildrenProcessing({node, localContexts, globalContext}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.MemberExpression && (node.property.type === AST_NODE_TYPES.Identifier || node.property.type === AST_NODE_TYPES.Literal)) {
            const objectType = parseESNodeType({node, localContexts, globalContext}, node.object, undefined, true);
            if(objectType instanceof LCETypeDeclared) {
                const fqn = objectType.fqn + "." + this.getNamespace(node.property);
                DependencyResolutionProcessor.registerDependency(localContexts, fqn, false);
            }
        }
        return new Map();
    }

    private getNamespace(node: Identifier | Literal): string {
        if(node.type === AST_NODE_TYPES.Identifier) {
            return node.name;
        } else {
            return node.raw;
        }
    }
}
