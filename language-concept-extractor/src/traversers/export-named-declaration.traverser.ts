import { AST_NODE_TYPES } from '@typescript-eslint/types';
import { ConceptMap } from '../concept';
import { ProcessingContext } from '../context';
import { ProcessorMap, Traverser } from '../traverser';
import { runTraverserForNode } from '../traverser.utils';

export class ExportNamedDeclarationTraverser extends Traverser {

    public processChildren(processingContext: ProcessingContext, processors: ProcessorMap): ConceptMap {
        const {node} = processingContext;
        
        if(node.type === AST_NODE_TYPES.ExportNamedDeclaration) {
            if(node.declaration)
                return runTraverserForNode(node.declaration, processingContext, processors) ?? new Map();
        }

        return new Map();
    }

}