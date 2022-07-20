import { AST_NODE_TYPES } from "@typescript-eslint/types";

import { ConceptMap, mergeConceptMaps } from "../concept";
import { ProcessingContext } from "../context";
import { ProcessorMap } from "../processor";
import { Traverser } from "../traverser";
import { runTraverserForNode, runTraverserForNodes } from "../traverser.utils";

export class PropertyTraverser extends Traverser {
    public static readonly KEY_PROP = "key";
    public static readonly INITIALIZER_PROP = "initializer";
    public static readonly DECORATORS_PROP = "decorators";

    public traverseChildren(processingContext: ProcessingContext, processors: ProcessorMap): ConceptMap {
        const { node } = processingContext;
        const conceptMaps: ConceptMap[] = [];

        if (
            node.type === AST_NODE_TYPES.PropertyDefinition ||
            node.type === AST_NODE_TYPES.Property ||
            node.type === AST_NODE_TYPES.TSPropertySignature
        ) {
            runTraverserForNode(node.key, { parentPropName: PropertyTraverser.KEY_PROP }, processingContext, processors, conceptMaps);

            if (node.type === AST_NODE_TYPES.PropertyDefinition || node.type === AST_NODE_TYPES.Property) {
                if (node.value)
                    runTraverserForNode(
                        node.value,
                        { parentPropName: PropertyTraverser.INITIALIZER_PROP },
                        processingContext,
                        processors,
                        conceptMaps
                    );
                if (node.type === AST_NODE_TYPES.PropertyDefinition && node.decorators)
                    runTraverserForNodes(
                        node.decorators,
                        { parentPropName: PropertyTraverser.DECORATORS_PROP },
                        processingContext,
                        processors,
                        conceptMaps
                    );
            } else {
                if (node.initializer) {
                    return (
                        runTraverserForNode(
                            node.initializer,
                            {
                                parentPropName: PropertyTraverser.INITIALIZER_PROP,
                            },
                            processingContext,
                            processors
                        ) ?? new Map()
                    );
                }
            }
        }

        return mergeConceptMaps(...conceptMaps);
    }
}
