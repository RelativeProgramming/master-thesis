import { Integer, Session } from 'neo4j-driver';
import { getAndCastConcepts, LCEConcept } from '../concept';
import { LCEClassDeclaration } from '../concepts/class-declaration.concept';
import { LCEDependency } from '../concepts/dependency.concept';
import { LCEExportDeclaration } from '../concepts/export-declaration.concept';
import { LCEImportDeclaration } from '../concepts/import-declaration.concept';
import { LCETypeScriptProject } from '../concepts/typescript-project.concept';
import { ConnectionIndex } from '../connection-index';
import { Generator } from '../generator';
import { Utils } from '../utils';
import { createClassLikeTypeParameterNodes, createMemberNodes } from './class-like-declaration.generator.utils';
import { createDecoratorNode } from './decorator.generator.utils';
import { createTypeNode } from './type.generator.utils';

/**
 * Generates all graph structures related to dependencies between files in the form of imports and exports.
 */
export class DependencyGenerator extends Generator {

    async run(neo4jSession: Session, concepts: Map<string, LCEConcept[]>, connectionIndex: ConnectionIndex): Promise<void> {
        const project = getAndCastConcepts<LCETypeScriptProject>(LCETypeScriptProject.conceptId, concepts)[0];

        const exports: LCEExportDeclaration[] = getAndCastConcepts(LCEExportDeclaration.conceptId, concepts);
        console.log("Generating graph structures for " + exports.length + " exports...");
        
        for(let ex of exports) {
            if(ex.kind === "namespace" || ex.importSource !== undefined) {
                // TODO: implement re-exports
            } else {
                const relationAttrs = {
                    exportedName: ex.alias ?? ex.identifier
                }
                await neo4jSession.run(
                    `
                    MATCH (file:TS:Module {fileName: $sourcePath})
                    MATCH (decl:TS {fqn: $fqn})
                    CREATE (file)-[:EXPORTS $relationAttrs]->(decl)
                    RETURN file
                    `, {
                        sourcePath: ex.sourceFilePath.replace(project.projectRoot, ""),
                        fqn: ex.declFqn!,
                        relationAttrs
                    }
                );
            }
        }

        /*
            TODO: properly implement dependency generation
            1. generate all depends-on relations, based on direct usage and create external references on demand
            2. transitively propagate and merge all depends-on relations
        */

        const dependencies: LCEDependency[] = getAndCastConcepts(LCEDependency.conceptId, concepts);
        console.log("Generating graph structures for " + dependencies.length + " direct dependencies...");
        const externalModules = new Map<string, Integer>();
        const externalDeclarations = new Map<string, Integer>();
        for(let dep of dependencies) {
            // Create external module/declaration nodes if needed
            if(dep.external) {
                if(dep.targetType === "declaration") {
                    const modulePath = Utils.extractPathFromFQN(dep.fqn);
                    if(!externalModules.has(modulePath)) {
                        externalModules.set(modulePath, Utils.getNodeIdFromQueryResult(await neo4jSession.run(
                            `
                            CREATE (mod:TS:ExternalModule $modProps)
                            RETURN id(mod)
                            `, {
                                modProps: {fileName: modulePath}
                            }
                        )));
                    }
                    if(!externalDeclarations.has(dep.fqn)) {
                        externalModules.set(dep.fqn, Utils.getNodeIdFromQueryResult(await neo4jSession.run(
                            `
                            MATCH (mod:TS)
                            WHERE id(mod) = $modId
                            CREATE (mod)-[:DECLARES]->(decl:TS:ExternalDeclaration $declProps)
                            RETURN id(decl)
                            `, {
                                modId: externalModules.get(modulePath),
                                declProps: {fqn: dep.fqn}
                            }
                        )));
                    }
                } else if(!externalModules.has(dep.fqn)) {
                    externalModules.set(dep.fqn, Utils.getNodeIdFromQueryResult(await neo4jSession.run(
                        `
                        CREATE (mod:TS:ExternalModule $modProps)
                        RETURN id(mod)
                        `, {
                            modProps: {fileName: dep.fqn}
                        }
                    )));
                }
            }

            // Create depends-on relation
            const options = {
                source: dep.sourceFQN,
                target: dep.fqn,
                depProps: {
                    cardinality: dep.cardinality,
                }
            };
            const srcMatch = dep.sourceType === "declaration" ? 
                "MATCH (src:TS {fqn: $source})\n" : 
                "MATCH (src:TS {fileName: $source})\n";
            const trgtMatch = dep.targetType === "declaration" ?
                "MATCH (trgt:TS {fqn: $target})\n" : 
                "MATCH (trgt:TS {fileName: $target})\n";
            await neo4jSession.run(srcMatch + trgtMatch +
                `
                CREATE (src)-[:DEPENDS_ON $depProps]->(trgt)
                RETURN trgt
                `, options
            );
        }
    }

}