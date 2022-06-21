import { AST_NODE_TYPES } from '@typescript-eslint/types';

import { ConceptMap, mergeConceptMaps } from '../concept';
import { ProcessingContext } from '../context';
import { ProcessorMap } from '../processor';
import { Traverser } from '../traverser';
import { runTraverserForNode, runTraverserForNodes } from '../traverser.utils';

export class ClassDeclarationTraverser extends Traverser {

    public static readonly DECORATORS_PROP = "decorators";
    public static readonly TYPE_PARAMETERS_PROP = "type-parameters";
    public static readonly EXTENDS_PROP = "extends";
    public static readonly IMPLEMENTS_PROP = "implements";
    public static readonly EXTENDS_TYPE_PARAMETERS_PROP = "extends-type-parameters";
    public static readonly MEMBERS_PROP = "members";

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
                runTraverserForNode(node.superClass, {parentPropName: ClassDeclarationTraverser.EXTENDS_PROP}, processingContext, processors, conceptMaps);
            }
            if(node.implements) {
                runTraverserForNodes(node.implements, {parentPropName: ClassDeclarationTraverser.IMPLEMENTS_PROP}, processingContext, processors, conceptMaps);
            }
            if(node.superTypeParameters) {
                runTraverserForNodes(node.superTypeParameters.params, {parentPropName: ClassDeclarationTraverser.EXTENDS_TYPE_PARAMETERS_PROP}, processingContext, processors, conceptMaps);
            }
            runTraverserForNodes(node.body.body, {parentPropName: ClassDeclarationTraverser.MEMBERS_PROP}, processingContext, processors, conceptMaps);
        }

        return mergeConceptMaps(...conceptMaps);
    }
}