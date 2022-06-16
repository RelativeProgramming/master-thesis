import { AST_NODE_TYPES } from '@typescript-eslint/types';
import { ConceptMap } from '../concept';
import { ProcessingContext } from '../context';
import { ProcessorMap, Traverser } from '../traverser';
import { runTraverserForNodes } from '../traverser.utils';
import { Utils } from '../utils';

export class ClassDeclarationTraverser extends Traverser {

    public processChildren(processingContext: ProcessingContext, processors: ProcessorMap): ConceptMap {
        const {node} = processingContext;
        const conceptMaps: ConceptMap[] = [];

        if(node.type === AST_NODE_TYPES.ClassDeclaration) {
            if(node.decorators) {
                runTraverserForNodes(node.decorators, processingContext, processors, conceptMaps);
            }
            if(node.typeParameters) {
                runTraverserForNodes(node.typeParameters.params, processingContext, processors, conceptMaps);
            }
            if(node.superTypeParameters) {
                runTraverserForNodes(node.superTypeParameters.params, processingContext, processors, conceptMaps);
            }
            runTraverserForNodes(node.body.body, processingContext, processors, conceptMaps);
        }

        return Utils.mergeArrayMaps(...conceptMaps);
    }

}