import { Node } from '@typescript-eslint/types/dist/generated/ast-spec';
import { ConceptMap } from './concept';
import { ProcessingContext } from './context';
import { TRAVERSERS } from './features';
import { ProcessorMap } from './traverser';
import { Utils } from './utils';


export function runTraverserForNode(
    node_: Node, 
    {globalContext, localContexts, node}: ProcessingContext, 
    processors: ProcessorMap,
    conceptMaps?: ConceptMap[]
): ConceptMap | undefined {
    const traverser = TRAVERSERS.get(node.type);
    if(traverser) {
        node_.parent = node;
        const result = traverser.traverse({
            globalContext,
            localContexts,
            node: node_
        }, processors);
        if(conceptMaps)
            conceptMaps.push(result);
        return result;
    }
    else {
        return undefined;
    }
}

export function runTraverserForNodes(
    nodes: Node[], 
    {globalContext, localContexts, node}: ProcessingContext, 
    processors: ProcessorMap,
    conceptMaps?: ConceptMap[]
): ConceptMap | undefined {
    const concepts: ConceptMap[] = [];
    for(let n of nodes) {
        n.parent = node;
        runTraverserForNode(n, {
            globalContext,
            localContexts,
            node: n
        }, processors, concepts);
    }
    if(concepts.length > 0) {
        const result = Utils.mergeArrayMaps(...concepts);
        if(conceptMaps)
            conceptMaps.push(result);
        return result;
    } else {
        return undefined;
    }
}
