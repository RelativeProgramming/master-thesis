import * as path from 'path';
import * as fs from 'fs';
import { Node, Symbol } from 'typescript';
import { Node as ESNode } from '@typescript-eslint/types/dist/generated/ast-spec';
import { Integer, QueryResult } from 'neo4j-driver';
import { GlobalContext } from './context';


export class Utils {
    
    /**
     * @param sourceData basic data strcutures of current source file
     * @param node TS node in AST
     * @returns the fully qualified name of the element described in node
     */
    static getRelativeFQNForDeclaredTypeESNode(sourceData: GlobalContext, statement: ESNode): string {
        const tc = sourceData.typeChecker;
        const node: Node = sourceData.services.esTreeNodeToTSNodeMap.get(statement);
        const type = tc.getTypeAtLocation(node);
        const symbol = type.getSymbol();
        if(symbol === undefined) {
            return "";
        }
        
        const fqn = tc.getFullyQualifiedName(symbol);
        if(this.isSymbolInProject(sourceData, symbol)) {
            return this.getRelativeFQN(sourceData, fqn);
        } else {
            return fqn;
        }
    }

    /**
     * @param sourceData basic data strcutures of current source file
     * @param node TS node in AST
     * @returns the fully qualified name of the element described in node
     */
    static getRelativeFQNForIdentifierESNode(sourceData: GlobalContext, statement: ESNode): string {
        const tc = sourceData.typeChecker;
        const node: Node = sourceData.services.esTreeNodeToTSNodeMap.get(statement);
        const symbol = tc.getSymbolAtLocation(node);
        if(symbol === undefined) {
            return "";
        }
        
        const fqn = tc.getFullyQualifiedName(symbol);
        if(this.isSymbolInProject(sourceData, symbol)) {
            return this.getRelativeFQN(sourceData, fqn);
        } else {
            return fqn;
        }
    }


    /**
     * @param sourceData data for the source file that contains the given FQN
     * @param fqn a fully qualified name obtained by the TS TypeChecker
     * @returns a consistent fully qualified name using a path relative to the project root
     */
    static getRelativeFQN(sourceData: GlobalContext, fqn: string): string {
        let relativeFqn = fqn.replace(sourceData.projectRoot, ".");

        // local object: add source file path
        if(fqn === relativeFqn) {
          relativeFqn = '"' + sourceData.sourceFilePath.replace(sourceData.projectRoot, ".").replace(".ts", "") + '".' + relativeFqn;
        }
        return relativeFqn;
    }

    /**
     * @param sourceData data for the source file that contains the given symbol
     * @param symbol symbol data of a source code node (may be undefined)
     * @returns whether if the given symbol is declared inside the local project
     */
    static isSymbolInProject(sourceData: GlobalContext, symbol?: Symbol): boolean {
        const sourceFile = symbol?.valueDeclaration?.getSourceFile();
        const hasSource = !!sourceFile;
        const isStandardLibrary = hasSource && sourceData.services.program.isSourceFileDefaultLibrary(sourceFile!)
        const isExternal = hasSource && sourceData.services.program.isSourceFileFromExternalLibrary(sourceFile!);
        return hasSource && !isStandardLibrary && !isExternal;
    }

    /**
     * Returns the paths for all files with a given ending inside a directory. (scans recursively)
     * @param path path to the directory that shall be scanned
     * @param endings whitelist of endings of files that should
     * @param ignoredDirs directories that should not be scanned
     * @returns 
     */
    static getFileList(path: string, endings: string[] = [], ignoredDirs: string[] = []): string[] {
        let allFiles = Utils.getAllFiles(path, [], ignoredDirs);
        return allFiles.filter(val => {
            let match: boolean = false;
            for (let e of endings) {
                if (val.endsWith(e)) {
                    match = true;
                    break;
                }
            }
            return match;
        });
    }

    private static getAllFiles(dirPath: string, arrayOfFiles: string[] = [], ignoredDirs: string[] = []): string[] {
        let files = fs.readdirSync(dirPath);
      
        files.forEach(function(file) {
          if (fs.statSync(dirPath + "/" + file).isDirectory() && !ignoredDirs.includes(file)) {
            arrayOfFiles = Utils.getAllFiles(dirPath + "/" + file, arrayOfFiles, ignoredDirs);
          } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
          }
        })
      
        return arrayOfFiles;
    }


    /**
     * Extracts a node id from a cypher query result for use in later queries.
     * 
     * Use the following query pattern:
     * `MATCH (n) WHERE id(n) = id`
     * 
     * @param res query result with one record which contains the node id at position 0
     * @returns the node id from the query result
     */
    static getNodeIdFromQueryResult(res: QueryResult): Integer {
        return res.records[0].get(0);
    }

    /**
     * Extracts node ids from a cypher query result for use in later queries.
     * 
     * Use the following query pattern:
     * `MATCH (n) WHERE id(n) in $ids`
     * 
     * @param res query result containing a list of records with node ids at position 0
     * @returns list of node ids from the query result
     */
    static getNodeIdsFromQueryResult(res: QueryResult): Integer[] {
        return res.records.map(rec => rec.get(0));
    }

    /**
     * Merges the given Maps. Array values of the same key are concatenated.
     */
    static mergeArrayMaps<K, V>(...maps: Map<K, V[]>[]): Map<K, V[]> {
        const result: Map<K, V[]> = new Map();
        for(let map of maps) {
            for(let [k, vArr] of map.entries()) {
                const res = result.get(k);
                if(res) {
                    result.set(k, res.concat(vArr));
                } else {
                    result.set(k, vArr);
                }
            }
        }
        return result;
    }
    
}