import { AST_NODE_TYPES } from '@typescript-eslint/types';

import { ConceptMap, singleEntryConceptMap } from '../concept';
import { LCETypeNotIdentified } from '../concepts/type.concept';
import {
    LCEValue,
    LCEValueArray,
    LCEValueCall,
    LCEValueClass,
    LCEValueComplex,
    LCEValueDeclared,
    LCEValueFunction,
    LCEValueLiteral,
    LCEValueMember,
    LCEValueNull,
    LCEValueObject,
    LCEValueObjectProperty,
} from '../concepts/value.concept';
import { ProcessingContext } from '../context';
import { ExecutionCondition } from '../execution-condition';
import { Processor } from '../processor';
import { getAndDeleteAllValueChildConcepts, getAndDeleteChildConcepts, getParentPropName } from '../processor.utils';
import { ArrayExpressionTraverser, CallExpressionTraverser, MemberExpressionTraverser, ObjectExpressionTraverser } from '../traversers/expression.traverser';
import { PropertyTraverser } from '../traversers/property.traverser';
import { DependencyResolutionProcessor } from './dependency-resolution.processor';
import { parseESNodeType } from './type.utils';
import { VariableDeclaratorProcessor } from './variable-declaration.processor';

export const VALUE_PROCESSING_FLAG = "value-processing";

export class LiteralValueProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.Literal],
        ({localContexts}) => {
            return !!localContexts.parentContexts?.has(VALUE_PROCESSING_FLAG);
        },
    );

    public override postChildrenProcessing({node}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.Literal) {
            if(node.value === null) {
                return singleEntryConceptMap(LCEValueNull.conceptId, new LCEValueNull("null"));
            } else {
                return singleEntryConceptMap(LCEValueLiteral.conceptId, new LCEValueLiteral(node.value));
            }
            
        }
        return new Map();
    }
}

export class IdentifierValueProcessor extends Processor {

    public static readonly DO_NOT_RESOLVE_VALUE_IDENTIFIER_FLAG = 'resolve-value-identifier';

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.Identifier],
        ({localContexts}) => {
            return !!localContexts.parentContexts?.has(VALUE_PROCESSING_FLAG);
        },
    );

    public override postChildrenProcessing({node, localContexts, globalContext}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.Identifier) {
            if(node.name === "undefined") {
                return singleEntryConceptMap(LCEValueNull.conceptId, new LCEValueNull("undefined"));
            } else {
                const declaredValue = new LCEValueDeclared(
                    parseESNodeType({node, localContexts, globalContext}, node, node.name, true),
                    node.name
                );
                const resolve: number | undefined = localContexts.parentContexts?.get(IdentifierValueProcessor.DO_NOT_RESOLVE_VALUE_IDENTIFIER_FLAG);

                if(resolve === undefined || (resolve === 0 && getParentPropName(localContexts) === MemberExpressionTraverser.OBJECT_PROP)) {
                    DependencyResolutionProcessor.scheduleFqnResolution(localContexts, node.name, declaredValue);
                }
                
                return singleEntryConceptMap(LCEValueDeclared.conceptId, declaredValue);
            }
            
        }
        return new Map();
    }
}

export class MemberValueProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.MemberExpression],
        ({localContexts}) => {
            return !!localContexts.parentContexts?.has(VALUE_PROCESSING_FLAG);
        },
    );

    public override preChildrenProcessing({localContexts}: ProcessingContext): void {
        localContexts.currentContexts.set(VALUE_PROCESSING_FLAG, true);
        if(!!localContexts.parentContexts?.has(IdentifierValueProcessor.DO_NOT_RESOLVE_VALUE_IDENTIFIER_FLAG)) {
            localContexts.currentContexts.set(IdentifierValueProcessor.DO_NOT_RESOLVE_VALUE_IDENTIFIER_FLAG, 
                localContexts.parentContexts!.get(IdentifierValueProcessor.DO_NOT_RESOLVE_VALUE_IDENTIFIER_FLAG)! + 1);
        } else {
            localContexts.currentContexts.set(IdentifierValueProcessor.DO_NOT_RESOLVE_VALUE_IDENTIFIER_FLAG, 0);
        }
    }

    public override postChildrenProcessing({node, localContexts}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.MemberExpression && 
            childConcepts.has(MemberExpressionTraverser.OBJECT_PROP) && 
            childConcepts.has(MemberExpressionTraverser.PROPERTY_PROP)
        ) {
            const objects = getAndDeleteAllValueChildConcepts(MemberExpressionTraverser.OBJECT_PROP, childConcepts);
            const properties = getAndDeleteAllValueChildConcepts(MemberExpressionTraverser.PROPERTY_PROP, childConcepts);
            if(objects.length === 1 && properties.length === 1) {
                return singleEntryConceptMap(LCEValueMember.conceptId, new LCEValueMember(
                    properties[0].type,
                    objects[0],
                    properties[0]
                ));
            }
        }
        return new Map();
    }
}

export class ObjectValueProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.ObjectExpression],
        ({localContexts}) => {
            return !!localContexts.parentContexts?.has(VALUE_PROCESSING_FLAG);
        },
    );

    public override preChildrenProcessing({localContexts}: ProcessingContext): void {
        localContexts.currentContexts.set(VALUE_PROCESSING_FLAG, true);
    }

    public override postChildrenProcessing({node, localContexts, globalContext}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.ObjectExpression) {
            const properties: LCEValueObjectProperty[] = getAndDeleteChildConcepts(ObjectExpressionTraverser.PROPERTIES_PROP, LCEValueObjectProperty.conceptId, childConcepts);
            const variableDeclarationFQN = localContexts.getNextContext(VariableDeclaratorProcessor.VARIABLE_DECLARATOR_FQN_CONTEXT);
            const type = parseESNodeType({node, localContexts, globalContext}, node, variableDeclarationFQN?.[0]);
            return singleEntryConceptMap(LCEValueObject.conceptId, new LCEValueObject(
                type,
                new Map(properties.map((prop => [prop.name, prop.value]))),
            ));
        }
        return new Map();
    }
}

export class ObjectValuePropertyProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.Property],
        ({localContexts}) => {
            return !!localContexts.parentContexts?.has(VALUE_PROCESSING_FLAG);
        },
    );

    public override preChildrenProcessing({localContexts}: ProcessingContext): void {
        localContexts.currentContexts.set(VALUE_PROCESSING_FLAG, true);
    }

    public override postChildrenProcessing({node}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.Property) {
            getAndDeleteAllValueChildConcepts(PropertyTraverser.KEY_PROP, childConcepts);
            const properties = getAndDeleteAllValueChildConcepts(PropertyTraverser.INITIALIZER_PROP, childConcepts);
            if(node.key.type === AST_NODE_TYPES.Identifier && properties.length === 1) {
                return singleEntryConceptMap(LCEValueObjectProperty.conceptId, new LCEValueObjectProperty(
                    node.key.name,
                    properties[0]
                ));
            }
        }
        return new Map();
    }
}

export class ArrayValueProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.ArrayExpression],
        ({localContexts}) => {
            return !!localContexts.parentContexts?.has(VALUE_PROCESSING_FLAG);
        },
    );

    public override preChildrenProcessing({localContexts}: ProcessingContext): void {
        localContexts.currentContexts.set(VALUE_PROCESSING_FLAG, true);
    }

    public override postChildrenProcessing({node, localContexts, globalContext}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.ArrayExpression) {
            const elements: LCEValue[] = getAndDeleteAllValueChildConcepts(ArrayExpressionTraverser.ELEMENTS_PROP, childConcepts);
            return singleEntryConceptMap(LCEValueArray.conceptId, new LCEValueArray(
                parseESNodeType({node, localContexts, globalContext}, node),
                elements
            ));
        }
        return new Map();
    }
}

export class CallValueProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.CallExpression],
        ({localContexts}) => {
            return !!localContexts.parentContexts?.has(VALUE_PROCESSING_FLAG);
        },
    );

    public override preChildrenProcessing({localContexts}: ProcessingContext): void {
        localContexts.currentContexts.set(VALUE_PROCESSING_FLAG, true);
    }

    public override postChildrenProcessing({node, localContexts, globalContext}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.CallExpression) {
            const callee: LCEValue[] = getAndDeleteAllValueChildConcepts(CallExpressionTraverser.CALLEE_PROP, childConcepts);
            const args: LCEValue[] = getAndDeleteAllValueChildConcepts(CallExpressionTraverser.ARGUMENTS_PROP, childConcepts);
            const type = parseESNodeType({node, localContexts, globalContext}, node);

            return singleEntryConceptMap(LCEValueCall.conceptId, new LCEValueCall(
                parseESNodeType({node, localContexts, globalContext}, node),
                callee[0],
                args,
                node.typeParameters?.params.map(param => parseESNodeType({node: param, localContexts, globalContext}, param)) ?? [],
            ));
        }
        return new Map();
    }
}

export class FunctionValueProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.FunctionExpression],
        ({localContexts}) => {
            return !!localContexts.parentContexts?.has(VALUE_PROCESSING_FLAG);
        },
    );

    public override postChildrenProcessing({node, localContexts, globalContext}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.FunctionExpression) {
            // TODO: add proper function value
            return singleEntryConceptMap(LCEValueFunction.conceptId, new LCEValueFunction(
                new LCETypeNotIdentified("function expression"), 
            ));
        }
        return new Map();
    }
}

export class ClassValueProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.ClassExpression],
        ({localContexts}) => {
            return !!localContexts.parentContexts?.has(VALUE_PROCESSING_FLAG);
        },
    );

    public override postChildrenProcessing({node, localContexts, globalContext}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.ClassExpression) {
            // TODO: add proper class value
            return singleEntryConceptMap(LCEValueClass.conceptId, new LCEValueClass(
                new LCETypeNotIdentified("class expression"), 
            ));
        }
        return new Map();
    }
}

export class ComplexValueProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [
            AST_NODE_TYPES.SpreadElement,
            AST_NODE_TYPES.ArrayPattern,
            AST_NODE_TYPES.ArrowFunctionExpression,
            AST_NODE_TYPES.AssignmentExpression,
            AST_NODE_TYPES.AwaitExpression,
            AST_NODE_TYPES.BinaryExpression,
            AST_NODE_TYPES.ChainExpression,
            AST_NODE_TYPES.ConditionalExpression,
            AST_NODE_TYPES.ImportExpression,
            AST_NODE_TYPES.LogicalExpression,
            AST_NODE_TYPES.NewExpression,
            AST_NODE_TYPES.ObjectPattern,
            AST_NODE_TYPES.SequenceExpression,
            AST_NODE_TYPES.TaggedTemplateExpression,
            AST_NODE_TYPES.TemplateLiteral,
            AST_NODE_TYPES.TSAsExpression,
            AST_NODE_TYPES.TSNonNullExpression,
            AST_NODE_TYPES.TSTypeAssertion,
            AST_NODE_TYPES.UnaryExpression,
            AST_NODE_TYPES.UpdateExpression,
            AST_NODE_TYPES.YieldExpression,
        ],
        ({localContexts}) => {
            return !!localContexts.parentContexts?.has(VALUE_PROCESSING_FLAG);
        },
    );

    public override postChildrenProcessing({node, localContexts, globalContext}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        return singleEntryConceptMap(LCEValueComplex.conceptId, new LCEValueComplex(
            globalContext.services.esTreeNodeToTSNodeMap.get(node).getText() 
        ));
    }
}
