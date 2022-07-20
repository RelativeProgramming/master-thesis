import { AST_NODE_TYPES } from "@typescript-eslint/types";

import { ConceptMap, singleEntryConceptMap } from "../concept";
import { LCEEnumDeclaration, LCEEnumMember } from "../concepts/enum-declaration.concept";
import { ProcessingContext } from "../context";
import { ExecutionCondition } from "../execution-condition";
import { Processor } from "../processor";
import { getAndDeleteAllValueChildConcepts, getAndDeleteChildConcepts } from "../processor.utils";
import { EnumDeclarationTraverser, EnumMemberTraverser } from "../traversers/enum.traverser";
import { DependencyResolutionProcessor } from "./dependency-resolution.processor";
import { VALUE_PROCESSING_FLAG } from "./value.processor";

export class EnumDeclarationProcessor extends Processor {
    public static readonly PARSE_ENUM_MEMBERS_CONTEXT = "parse-enum-members";

    public executionCondition: ExecutionCondition = new ExecutionCondition([AST_NODE_TYPES.TSEnumDeclaration], ({ node }) => {
        return (
            !!node.parent &&
            (node.parent.type === AST_NODE_TYPES.ExportNamedDeclaration ||
                node.parent.type === AST_NODE_TYPES.ExportDefaultDeclaration ||
                node.parent.type === AST_NODE_TYPES.Program)
        );
    });

    public override preChildrenProcessing({ localContexts }: ProcessingContext): void {
        localContexts.currentContexts.set(EnumDeclarationProcessor.PARSE_ENUM_MEMBERS_CONTEXT, true);
        DependencyResolutionProcessor.createDependencyIndex(localContexts);
    }

    public override postChildrenProcessing({ node, localContexts, globalContext }: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if (node.type === AST_NODE_TYPES.TSEnumDeclaration) {
            const enumName = node.id.name;
            const fqn = DependencyResolutionProcessor.constructScopeFQN(localContexts);
            DependencyResolutionProcessor.registerDeclaration(
                localContexts,
                enumName,
                fqn,
                localContexts.currentContexts.has(DependencyResolutionProcessor.FQN_SCOPE_CONTEXT)
            );

            const members: LCEEnumMember[] = getAndDeleteChildConcepts(EnumDeclarationTraverser.MEMBERS_PROP, LCEEnumMember.conceptId, childConcepts);

            const enumeration = new LCEEnumDeclaration(
                node.id.name,
                fqn,
                members,
                node.const ?? false,
                node.declare ?? false,
                globalContext.sourceFilePath
            );
            if (localContexts.currentContexts.has(DependencyResolutionProcessor.FQN_SCOPE_CONTEXT)) {
                DependencyResolutionProcessor.scheduleFqnResolution(localContexts, node.id.name, enumeration);
            }
            return singleEntryConceptMap(LCEEnumDeclaration.conceptId, enumeration);
        }
        return new Map();
    }
}

export class EnumMemberProcessor extends Processor {
    public executionCondition: ExecutionCondition = new ExecutionCondition([AST_NODE_TYPES.TSEnumMember], ({ localContexts }) => {
        return !!localContexts.parentContexts?.has(EnumDeclarationProcessor.PARSE_ENUM_MEMBERS_CONTEXT);
    });

    public override preChildrenProcessing({ node, localContexts }: ProcessingContext): void {
        if (node.type === AST_NODE_TYPES.TSEnumMember && node.initializer) localContexts.currentContexts.set(VALUE_PROCESSING_FLAG, true);
    }

    public override postChildrenProcessing({ node, localContexts }: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        if (node.type === AST_NODE_TYPES.TSEnumMember && !node.computed) {
            const init = getAndDeleteAllValueChildConcepts(EnumMemberTraverser.INIT_PROP, childConcepts);

            const memberName = node.id.type === AST_NODE_TYPES.Identifier ? node.id.name : node.id.raw;

            const member = new LCEEnumMember(
                memberName,
                DependencyResolutionProcessor.constructFQNPrefix(localContexts) + memberName,
                init.length === 1 ? init[0] : undefined
            );
            return singleEntryConceptMap(LCEEnumMember.conceptId, member);
        }
        // TODO: add enum member with computed names
        return new Map();
    }
}
