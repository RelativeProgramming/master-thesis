import { Node } from '@typescript-eslint/types/dist/generated/ast-spec';

import { ConceptMap, mergeConceptMaps } from './concept';
import { ProcessingContext } from './context';
import { TRAVERSERS } from './features';
import { ProcessorMap } from './processor';
import { TraverserContext } from './traverser';

/**
 * Tries to find an appropriate `Traverser` for the given node and calls its `traverse` method on the node.
 * @returns the concepts generated for the node and/or its children or `undefined` if no `Traverser` could be found
 */
export function runTraverserForNode(
    node: Node, 
    traverserContext: TraverserContext,
    {globalContext, localContexts, node: parentNode}: ProcessingContext, 
    processors: ProcessorMap,
    conceptMaps?: ConceptMap[]
): ConceptMap | undefined {
    const traverser = TRAVERSERS.get(node.type);
    if(traverser) {
        node.parent = parentNode;
        const result = traverser.traverse(traverserContext, {
            globalContext,
            localContexts,
            node
        }, processors);
        if(conceptMaps)
            conceptMaps.push(result);
        return result;
    }
    else {
        return undefined;
    }
}

/**
 * Runs`runTraverserForNode` for the given nodes.
 * Also provides index information of the parent node property to the traversers.
 */
export function runTraverserForNodes(
    nodes: (Node | null)[],
    {parentPropName}: TraverserContext,
    processingContext: ProcessingContext, 
    processors: ProcessorMap,
    conceptMaps?: ConceptMap[]
): ConceptMap | undefined {
    const concepts: ConceptMap[] = [];
    for(let i = 0; i < nodes.length; i++) {
        let n = nodes[i];
        if(n) {
            runTraverserForNode(n, {parentPropName, parentPropIndex: i}, processingContext, processors, concepts);
        }
    }
    if(concepts.length > 0) {
        const result = mergeConceptMaps(...concepts);
        if(conceptMaps)
            conceptMaps.push(result);
        return result;
    } else {
        return undefined;
    }
}
