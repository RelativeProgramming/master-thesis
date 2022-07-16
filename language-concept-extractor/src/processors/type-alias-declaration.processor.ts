import { AST_NODE_TYPES } from '@typescript-eslint/types';

import { ConceptMap, mergeConceptMaps, singleEntryConceptMap } from '../concept';
import { LCETypeAliasDeclaration } from '../concepts/type-alias-declaration.concept';
import { ProcessingContext } from '../context';
import { ExecutionCondition } from '../execution-condition';
import { Processor } from '../processor';
import { DependencyResolutionProcessor } from './dependency-resolution.processor';
import { parseESNodeType, parseTypeAliasTypeParameters } from './type.utils';

export class TypeAliasDeclarationProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.TSTypeAliasDeclaration],
        ({node}) => {
            return !!node.parent && (
                node.parent.type === AST_NODE_TYPES.ExportNamedDeclaration ||
                node.parent.type === AST_NODE_TYPES.ExportDefaultDeclaration || 
                node.parent.type === AST_NODE_TYPES.Program
            );
        },
    );

    public override preChildrenProcessing({localContexts}: ProcessingContext): void {
        DependencyResolutionProcessor.createDependencyIndex(localContexts);
    }

    public override postChildrenProcessing({globalContext, localContexts, node}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if(node.type === AST_NODE_TYPES.TSTypeAliasDeclaration) {
            const typeAliasName = node.id.name;
            const fqn = DependencyResolutionProcessor.constructScopeFQN(localContexts);
            DependencyResolutionProcessor.registerDeclaration(localContexts, typeAliasName, fqn, localContexts.currentContexts.has(DependencyResolutionProcessor.FQN_SCOPE_CONTEXT));
            const typeAliasDecl = new LCETypeAliasDeclaration(
                typeAliasName,
                fqn,
                parseTypeAliasTypeParameters({globalContext, localContexts, node}, node),
                parseESNodeType({globalContext, localContexts, node}, node.typeAnnotation, typeAliasName),
                globalContext.sourceFilePath
            );
            return mergeConceptMaps(singleEntryConceptMap(LCETypeAliasDeclaration.conceptId, typeAliasDecl),
                DependencyResolutionProcessor.getRegisteredDependencies(localContexts));
        }
        return new Map();
    }
}
