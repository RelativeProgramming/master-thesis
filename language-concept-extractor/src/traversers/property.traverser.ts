import { AST_NODE_TYPES } from '@typescript-eslint/types';

import { ConceptMap, mergeConceptMaps } from '../concept';
import { ProcessingContext } from '../context';
import { ProcessorMap } from '../processor';
import { Traverser } from '../traverser';
import { runTraverserForNode, runTraverserForNodes } from '../traverser.utils';

export class PropertyDeclarationTraverser extends Traverser {

    public static readonly INITIALIZER_PROP = "initializer";
    public static readonly DECORATORS_PROP = "decorators";

    public traverseChildren(processingContext: ProcessingContext, processors: ProcessorMap): ConceptMap {
        const {node} = processingContext;
        
        if(node.type === AST_NODE_TYPES.PropertyDefinition) {
            const conceptMaps: ConceptMap[] = [];
            if(node.value) {
                runTraverserForNode(node.value, {parentPropName: PropertyDeclarationTraverser.INITIALIZER_PROP}, processingContext, processors, conceptMaps);
            }
            if(node.decorators) {
                runTraverserForNodes(node.decorators, {parentPropName: PropertyDeclarationTraverser.DECORATORS_PROP}, processingContext, processors, conceptMaps)
            }
            return mergeConceptMaps(...conceptMaps);
        }

        if(node.type === AST_NODE_TYPES.TSPropertySignature) {
            if(node.initializer) {
                return runTraverserForNode(node.initializer, {parentPropName: PropertyDeclarationTraverser.INITIALIZER_PROP}, processingContext, processors) ?? new Map();
            }
        }

        return new Map();
    }

}