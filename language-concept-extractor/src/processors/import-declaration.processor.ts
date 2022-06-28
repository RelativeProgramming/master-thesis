import { AST_NODE_TYPES } from '@typescript-eslint/types';

import { ConceptMap, createConceptMap, mergeConceptMaps } from '../concept';
import { LCEDependency } from '../concepts/dependency.concept';
import { LCEImportDeclaration } from '../concepts/import-declaration.concept';
import { ProcessingContext } from '../context';
import { ExecutionCondition } from '../execution-rule';
import { Processor } from '../processor';
import { Utils } from '../utils';
import { DependencyResolutionProcessor } from './dependency-resolution.processor';

export class ImportDeclarationProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.ImportDeclaration],
        () => true
    );

    public override postChildrenProcessing({node, localContexts, globalContext}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        // TODO: resolve complex import paths, e.g. https://stackoverflow.com/questions/42749973/what-does-the-mean-inside-an-import-path
        const concepts: ConceptMap[] = [];
        if(node.type === AST_NODE_TYPES.ImportDeclaration) {
            const fqnPrefix = DependencyResolutionProcessor.constructFQNPrefix(localContexts);
            let sourceFQN = globalContext.sourceFilePathRelative;
            const inProject = Utils.isPathInProject(node.source.value, globalContext.projectRoot, globalContext.sourceFilePath);
            const source = Utils.toAbsolutePath(node.source.value, globalContext.sourceFilePath).replace(globalContext.projectRoot, "");
            const isTypeImport = node.importKind === 'type';
            for(let specifier of node.specifiers) {
                let targetFQN = "";
                let isModule = false
                if(specifier.type === AST_NODE_TYPES.ImportSpecifier) {
                    targetFQN = '"' + source + '".' + specifier.imported.name;
                } else if(specifier.type === AST_NODE_TYPES.ImportDefaultSpecifier) {
                    targetFQN = '"' + source + '".default';
                } else if(specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier) {
                    targetFQN = source;
                    isModule = true;
                }
                DependencyResolutionProcessor.registerDeclaration(localContexts, fqnPrefix + specifier.local.name);
                concepts.push(createConceptMap(LCEDependency.conceptId, new LCEDependency(
                    targetFQN, 
                    isModule ? "module" : "declaration",
                    sourceFQN,
                    "module",
                    1,
                    !inProject,
                    
                )));
            }
        }
        return mergeConceptMaps(...concepts);
    }   
}
