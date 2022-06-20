import { AST_NODE_TYPES } from '@typescript-eslint/types';

import { ConceptMap, mergeConceptMaps } from '../concept';
import { ProcessingContext } from '../context';
import { ProcessorMap } from '../processor';
import { Traverser } from '../traverser';
import { runTraverserForNodes } from '../traverser.utils';

export class MethodSignatureTraverser extends Traverser {

    public static readonly TYPE_PARAMETERS_PROP = "type-parameters";
    public static readonly PARAMETERS_PROP = "parameters";

    public traverseChildren(processingContext: ProcessingContext, processors: ProcessorMap): ConceptMap {
        const {node} = processingContext;
        const conceptMaps: ConceptMap[] = [];

        if(node.type === AST_NODE_TYPES.TSMethodSignature) {
            if(node.typeParameters) {
                runTraverserForNodes(node.typeParameters.params, {parentPropName: MethodSignatureTraverser.TYPE_PARAMETERS_PROP}, processingContext, processors, conceptMaps);
            }
            
            runTraverserForNodes(node.params, {parentPropName: MethodSignatureTraverser.PARAMETERS_PROP}, processingContext, processors, conceptMaps);
        }

        return mergeConceptMaps(...conceptMaps);
    }

}

export class MethodDefinitionTraverser extends MethodSignatureTraverser {

    public static readonly DECORATORS_PROP = "decorators";
    public static readonly BODY_PROP = "body";

    public override traverseChildren(processingContext: ProcessingContext, processors: ProcessorMap): ConceptMap {
        const {node} = processingContext;
        const conceptMaps: ConceptMap[] = [];

        if(node.type === AST_NODE_TYPES.MethodDefinition) {
            if(node.decorators) {
                runTraverserForNodes(node.decorators, {parentPropName: MethodDefinitionTraverser.DECORATORS_PROP}, processingContext, processors, conceptMaps);
            }
            if(node.typeParameters) {
                runTraverserForNodes(node.typeParameters.params, {parentPropName: MethodDefinitionTraverser.TYPE_PARAMETERS_PROP}, processingContext, processors, conceptMaps);
            }
            
            runTraverserForNodes(node.value.params, {parentPropName: MethodDefinitionTraverser.PARAMETERS_PROP}, processingContext, processors, conceptMaps);
            
            if(node.value.body) {
                runTraverserForNodes(node.value.body.body, {parentPropName: MethodDefinitionTraverser.BODY_PROP}, processingContext, processors, conceptMaps);
            }
        }

        return mergeConceptMaps(...conceptMaps);
    }

}

export class MethodParameterPropertyTraverser extends Traverser {

    public static readonly DECORATORS_PROP = "decorators";

    public traverseChildren(processingContext: ProcessingContext, processors: ProcessorMap): ConceptMap {
        const {node} = processingContext;
        if(node.type === AST_NODE_TYPES.TSParameterProperty && node.decorators) {
            return runTraverserForNodes(node.decorators, {parentPropName: MethodParameterPropertyTraverser.DECORATORS_PROP}, processingContext, processors) ?? new Map();
        }

        return new Map();
    }

}