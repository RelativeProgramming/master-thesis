import { AST_NODE_TYPES } from '@typescript-eslint/types';

import { ConceptMap, mergeConceptMaps } from '../concept';
import { ProcessingContext } from '../context';
import { ProcessorMap } from '../processor';
import { Traverser } from '../traverser';
import { runTraverserForNode, runTraverserForNodes } from '../traverser.utils';

export class ClassDeclarationTraverser extends Traverser {

    public static readonly DECORATORS_PROP = "decorators";
    public static readonly TYPE_PARAMETERS_PROP = "type-parameters";
    public static readonly SUPER_CLASS_PROP = "super-class";
    public static readonly IMPLEMENTS_PROP = "implements";
    public static readonly SUPER_TYPE_PARAMETERS_PROP = "super-type-parameters";
    public static readonly CLASS_ELEMENTS_PROP = "class-elements";

    public traverseChildren(processingContext: ProcessingContext, processors: ProcessorMap): ConceptMap {
        const {node} = processingContext;
        const conceptMaps: ConceptMap[] = [];

        if(node.type === AST_NODE_TYPES.ClassDeclaration) {
            if(node.decorators) {
                runTraverserForNodes(node.decorators, {parentPropName: ClassDeclarationTraverser.DECORATORS_PROP}, processingContext, processors, conceptMaps);
            }
            if(node.typeParameters) {
                runTraverserForNodes(node.typeParameters.params, {parentPropName: ClassDeclarationTraverser.TYPE_PARAMETERS_PROP}, processingContext, processors, conceptMaps);
            }
            if(node.superClass) {
                runTraverserForNode(node.superClass, {parentPropName: ClassDeclarationTraverser.SUPER_CLASS_PROP}, processingContext, processors, conceptMaps);
            }
            if(node.implements) {
                runTraverserForNodes(node.implements, {parentPropName: ClassDeclarationTraverser.IMPLEMENTS_PROP}, processingContext, processors, conceptMaps);
            }
            if(node.superTypeParameters) {
                runTraverserForNodes(node.superTypeParameters.params, {parentPropName: ClassDeclarationTraverser.SUPER_TYPE_PARAMETERS_PROP}, processingContext, processors, conceptMaps);
            }
            runTraverserForNodes(node.body.body, {parentPropName: ClassDeclarationTraverser.CLASS_ELEMENTS_PROP}, processingContext, processors, conceptMaps);
        }

        return mergeConceptMaps(...conceptMaps);
    }
}

export class ClassImplementsTraverser extends Traverser {
    public traverseChildren(processingContext: ProcessingContext, processors: ProcessorMap): ConceptMap {
        // TODO: refine traversal
        return new Map();
    }
}