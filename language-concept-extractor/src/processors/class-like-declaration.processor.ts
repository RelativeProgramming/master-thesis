import { AST_NODE_TYPES } from '@typescript-eslint/types';
import { ClassPropertyNameNonComputed, PropertyNameNonComputed } from '@typescript-eslint/types/dist/generated/ast-spec';

import { ConceptMap, singleEntryConceptMap, mergeConceptMaps, createConceptMap } from '../concept';
import { LCEDecorator } from '../concepts/decorator.concept';
import { LCEConstructorDeclaration, LCEGetterDeclaration, LCEMethodDeclaration, LCEParameterDeclaration, LCEParameterPropertyDeclaration } from '../concepts/method-declaration.concept';
import { LCEPropertyDeclaration } from '../concepts/property-declaration.concept';
import { LCETypeFunction } from '../concepts/type.concept';
import { ProcessingContext } from '../context';
import { ExecutionCondition } from '../execution-condition';
import { Processor } from '../processor';
import { getAndDeleteChildConcepts, getChildConcepts, getParentPropIndex, getParentPropName } from '../processor.utils';
import { IdentifierTraverser } from '../traversers/expression.traverser';
import { MethodTraverser, ParameterPropertyTraverser } from '../traversers/method.traverser';
import { PropertyTraverser } from '../traversers/property.traverser';
import { DependencyResolutionProcessor } from './dependency-resolution.processor';
import { parseClassPropertyType, parseMethodType } from './type.utils';


export class MethodProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.MethodDefinition, AST_NODE_TYPES.TSMethodSignature],
        () => true
    );

    public override preChildrenProcessing({node, localContexts, globalContext}: ProcessingContext): void {
        if((node.type === AST_NODE_TYPES.MethodDefinition || node.type === AST_NODE_TYPES.TSMethodSignature) && !node.computed && 
        !!node.parent && (node.parent.type === AST_NODE_TYPES.ClassDeclaration || node.parent.type === AST_NODE_TYPES.TSInterfaceDeclaration)) {
            const [methodName, jsPrivate] = processMemberName(node.key)
            const functionType = parseMethodType({globalContext, localContexts, node}, node.parent, node, methodName, jsPrivate);
            if(functionType) {
                localContexts.currentContexts.set(MethodParameterProcessor.METHOD_TYPE_CONTEXT_ID, functionType);
            }
            DependencyResolutionProcessor.addScopeContext(localContexts, methodName);
            DependencyResolutionProcessor.createDependencyIndex(localContexts);
        }
    }

    public override postChildrenProcessing({node, localContexts}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if((node.type === AST_NODE_TYPES.MethodDefinition || node.type === AST_NODE_TYPES.TSMethodSignature) && !node.computed) {
            // TODO: handle static methods
            // TODO: handle overloads
            const functionType: LCETypeFunction | undefined = localContexts.currentContexts.get(MethodParameterProcessor.METHOD_TYPE_CONTEXT_ID);
            if(functionType) {
                const [methodName, jsPrivate] = processMemberName(node.key)
                const visibility = jsPrivate ? "js_private" : node.accessibility ?? "public";
                let fqn = DependencyResolutionProcessor.constructScopeFQN(localContexts);
                DependencyResolutionProcessor.registerDeclaration(localContexts, methodName, fqn, true);
                let methodConcept: ConceptMap = new Map();
                if(node.kind === "method") {
                    // method
                    if(functionType) {
                        methodConcept = singleEntryConceptMap(LCEMethodDeclaration.conceptId, new LCEMethodDeclaration(
                            methodName,
                            fqn,
                            getAndDeleteChildConcepts(MethodTraverser.PARAMETERS_PROP, LCEParameterDeclaration.conceptId, childConcepts),
                            functionType.returnType,
                            functionType.typeParameters,
                            "decorators" in node ? getAndDeleteChildConcepts(MethodTraverser.DECORATORS_PROP, LCEDecorator.conceptId, childConcepts) : [],
                            visibility,
                            "override" in node ? node.override : undefined
                        ));
                    }
                } else if(node.kind === "constructor") {
                    // constructor
                    methodConcept = singleEntryConceptMap(LCEConstructorDeclaration.conceptId, new LCEConstructorDeclaration(
                        fqn,
                        getAndDeleteChildConcepts(MethodTraverser.PARAMETERS_PROP, LCEParameterDeclaration.conceptId, childConcepts),
                        getAndDeleteChildConcepts(MethodTraverser.PARAMETERS_PROP, LCEParameterPropertyDeclaration.conceptId, childConcepts)
                    ));
                } else if(node.kind === "get") {
                    // getter
                    methodConcept = singleEntryConceptMap(LCEGetterDeclaration.conceptId, new LCEGetterDeclaration(
                        methodName,
                        fqn,
                        functionType.returnType,
                        "decorators" in node ? getAndDeleteChildConcepts(MethodTraverser.DECORATORS_PROP, LCEDecorator.conceptId, childConcepts) : [],
                        visibility,
                        "override" in node ? node.override : undefined
                    ));
                } else {
                    // setter
                    methodConcept = singleEntryConceptMap(LCEGetterDeclaration.conceptId, new LCEGetterDeclaration(
                        methodName,
                        fqn,
                        getAndDeleteChildConcepts(MethodTraverser.PARAMETERS_PROP, LCEParameterDeclaration.conceptId, childConcepts),
                        "decorators" in node ? getAndDeleteChildConcepts(MethodTraverser.DECORATORS_PROP, LCEDecorator.conceptId, childConcepts) : [],
                        visibility,
                        "override" in node ? node.override : undefined
                    ));
                }
                return mergeConceptMaps(methodConcept, DependencyResolutionProcessor.getRegisteredDependencies(localContexts));
            }
        }
        return new Map();
    }
}

export class MethodParameterProcessor extends Processor {

    public static readonly METHOD_TYPE_CONTEXT_ID = "method-type";

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.Identifier, AST_NODE_TYPES.TSParameterProperty], // TODO: add other parameter patterns
        ({localContexts}) => !!localContexts.parentContexts && 
            localContexts.parentContexts.has(MethodParameterProcessor.METHOD_TYPE_CONTEXT_ID) &&
            getParentPropName(localContexts) === MethodTraverser.PARAMETERS_PROP
    );

    public override postChildrenProcessing({node, localContexts, globalContext}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(localContexts.parentContexts) {
            const functionType: LCETypeFunction = localContexts.parentContexts.get(MethodParameterProcessor.METHOD_TYPE_CONTEXT_ID);
            if(functionType) {
                const paramIndex: number = getParentPropIndex(localContexts)!;
                const funcTypeParam = functionType.parameters[paramIndex];
                
                if(node.type === AST_NODE_TYPES.Identifier) {
                    return singleEntryConceptMap(LCEParameterDeclaration.conceptId, new LCEParameterDeclaration(
                        funcTypeParam.index,
                        funcTypeParam.name,
                        funcTypeParam.type,
                        "optional" in node && !!node.optional,
                        getAndDeleteChildConcepts(IdentifierTraverser.DECORATORS_PROP, LCEDecorator.conceptId, childConcepts)
                    ));
                } else if(node.type === AST_NODE_TYPES.TSParameterProperty) {
                    const paramPropConcept = singleEntryConceptMap(LCEParameterPropertyDeclaration.conceptId, new LCEParameterPropertyDeclaration(
                        funcTypeParam.index,
                        funcTypeParam.name,
                        DependencyResolutionProcessor.constructScopeFQN(localContexts) + funcTypeParam.name,
                        "optional" in node.parameter && !!node.parameter.optional,
                        funcTypeParam.type,
                        getChildConcepts(ParameterPropertyTraverser.DECORATORS_PROP, LCEDecorator.conceptId, childConcepts),
                        node.accessibility ?? "public",
                        !!node.readonly,
                        node.override
                    ));
                    const paramConcept = singleEntryConceptMap(LCEParameterDeclaration.conceptId, new LCEParameterDeclaration(
                        funcTypeParam.index,
                        funcTypeParam.name,
                        funcTypeParam.type,
                        "optional" in node.parameter && !!node.parameter.optional,
                        getAndDeleteChildConcepts(ParameterPropertyTraverser.DECORATORS_PROP, LCEDecorator.conceptId, childConcepts)
                    ));
                    return mergeConceptMaps(paramConcept, paramPropConcept);
                }
            }
        }

        return new Map();
    }

}

export class PropertyProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.PropertyDefinition, AST_NODE_TYPES.TSPropertySignature],
        () => true,
    );

    public override preChildrenProcessing({node, localContexts}: ProcessingContext): void {
        if((node.type === AST_NODE_TYPES.PropertyDefinition || node.type === AST_NODE_TYPES.TSPropertySignature) && !node.computed) {
            let [propertyName, _] = processMemberName(node.key);
            DependencyResolutionProcessor.addScopeContext(localContexts, propertyName);
            DependencyResolutionProcessor.createDependencyIndex(localContexts);
        }
    }

    public override postChildrenProcessing({node, localContexts, globalContext}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {

        if((node.type === AST_NODE_TYPES.PropertyDefinition || node.type === AST_NODE_TYPES.TSPropertySignature) && !node.computed) {
            // TODO: handle static properties
            const [propertyName, jsPrivate] = processMemberName(node.key);
            const fqn = DependencyResolutionProcessor.constructScopeFQN(localContexts);
            DependencyResolutionProcessor.registerDeclaration(localContexts, propertyName, fqn, true);

            return mergeConceptMaps(singleEntryConceptMap(LCEPropertyDeclaration.conceptId, new LCEPropertyDeclaration(
                propertyName,
                fqn,
                !!node.optional,
                parseClassPropertyType({globalContext, localContexts, node}, node.key),
                "decorators" in node ? getAndDeleteChildConcepts(PropertyTraverser.DECORATORS_PROP, LCEDecorator.conceptId, childConcepts) : [],
                jsPrivate ? "js_private" : node.accessibility ?? "public",
                !!node.readonly,
                "override" in node ? node.override : undefined
            )), DependencyResolutionProcessor.getRegisteredDependencies(localContexts));
        }

        return new Map();
    }
}


/** 
 * Returns the field or method name for a given non-computed class element.
 * Also returns if the element was declared private by using a #
 */
function processMemberName(name: ClassPropertyNameNonComputed | PropertyNameNonComputed): [string, boolean] {
    let result = "";
    let jsPrivate = false;

    if(name.type === AST_NODE_TYPES.Identifier) {
        result = name.name;
    } else if(name.type === AST_NODE_TYPES.Literal) {
        result = name.value+"";
    } else {
        result = name.name;
        jsPrivate = true;
    }

    return [result, jsPrivate];
}