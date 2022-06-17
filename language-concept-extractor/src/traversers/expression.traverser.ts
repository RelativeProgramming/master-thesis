import { AST_NODE_TYPES } from '@typescript-eslint/types';

import { ConceptMap, mergeConceptMaps } from '../concept';
import { ProcessingContext } from '../context';
import { ProcessorMap } from '../processor';
import { Traverser } from '../traverser';
import { runTraverserForNode, runTraverserForNodes } from '../traverser.utils';


export class IdentifierTraverser extends Traverser {

    public static readonly DECORATORS_PROP = "decorators";
    public static readonly TYPE_ANNOTATIONS_PROP = "type-annotations";

    public processChildren(processingContext: ProcessingContext, processors: ProcessorMap): ConceptMap {
        const {node} = processingContext;
        const conceptMaps: ConceptMap[] = [];

        if(node.type === AST_NODE_TYPES.Identifier) {
            if(node.decorators)
                runTraverserForNodes(node.decorators, {parentPropName: IdentifierTraverser.DECORATORS_PROP}, processingContext, processors, conceptMaps);
            if(node.typeAnnotation)
                runTraverserForNode(node.typeAnnotation, {parentPropName: IdentifierTraverser.TYPE_ANNOTATIONS_PROP}, processingContext, processors, conceptMaps);
        }

        return mergeConceptMaps(...conceptMaps);
    }

}