import { AST_NODE_TYPES } from '@typescript-eslint/types';

import { ConceptMap, createConceptMap, mergeConceptMaps } from '../concept';
import { LCEImportDeclaration } from '../concepts/import-declaration.concept';
import { ProcessingContext } from '../context';
import { ExecutionCondition } from '../execution-rule';
import { Processor } from '../processor';
import { Utils } from '../utils';

export class ImportDeclarationProcessor extends Processor {

    public executionCondition: ExecutionCondition = new ExecutionCondition(
        [AST_NODE_TYPES.ImportDeclaration],
        () => true
    );

    public override postChildrenProcessing({node, localContexts, globalContext}: ProcessingContext, childConcepts: ConceptMap): ConceptMap {
        // TODO: resolve complex import paths, e.g. https://stackoverflow.com/questions/42749973/what-does-the-mean-inside-an-import-path
        const concepts: ConceptMap[] = [];
        if(node.type === AST_NODE_TYPES.ImportDeclaration) {
            const inProject = Utils.isPathInProject(node.source.value, globalContext.projectRoot, globalContext.sourceFilePath);
            const source = Utils.toAbsolutePath(node.source.value, globalContext.sourceFilePath);
            const isTypeImport = node.importKind === 'type';
            for(let specifier of node.specifiers) {
                if(specifier.type === AST_NODE_TYPES.ImportSpecifier) {
                    concepts.push(createConceptMap(LCEImportDeclaration.conceptId, new LCEImportDeclaration(
                        specifier.imported.name,
                        specifier.local.name === specifier.imported.name ? undefined : specifier.local.name,
                        source,
                        inProject,
                        false,
                        isTypeImport ? 'type' : 'value',
                        globalContext.sourceFilePath
                    )));
                } else if(specifier.type === AST_NODE_TYPES.ImportDefaultSpecifier) {
                    concepts.push(createConceptMap(LCEImportDeclaration.conceptId, new LCEImportDeclaration(
                        specifier.local.name,
                        undefined,
                        source,
                        inProject,
                        true,
                        isTypeImport ? 'type' : 'value',
                        globalContext.sourceFilePath
                    )));
                } else if(specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier) {
                    concepts.push(createConceptMap(LCEImportDeclaration.conceptId, new LCEImportDeclaration(
                        specifier.local.name,
                        undefined,
                        source,
                        inProject,
                        false,
                        'namespace',
                        globalContext.sourceFilePath
                    )));
                }
            }
        }
        return mergeConceptMaps(...concepts);
    }
    
}
