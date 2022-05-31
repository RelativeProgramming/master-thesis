import * as path from 'path';
import * as fs from 'fs';
import { Node } from 'typescript';
import { SourceData } from './processor';
import { Node as ESNode } from '@typescript-eslint/types/dist/generated/ast-spec';


export default class Utils {
    
    /**
     * @param sourceData basic data strcutures of current source file
     * @param node TS node in AST
     * @returns the fully qualified name of the element described in node
     */
    static getRelativeFQNForESNode(sourceData: SourceData, statement: ESNode): string {
        const node: Node = sourceData.services.esTreeNodeToTSNodeMap.get(statement);
        const type = sourceData.typeChecker.getTypeAtLocation(node);
        const symbol = type.getSymbol();
        if(symbol == undefined) {
            return "";
        }
        const fqn = sourceData.typeChecker.getFullyQualifiedName(symbol);
        return this.getRelativeFQN(sourceData, fqn);
    }

    /**
     * @param sourceData data for the source file that contains the given FQN
     * @param fqn a fully qualified name obtained by the TS TypeChecker
     * @returns a consistent fully qualified name using a path relative to the project root
     */
    static getRelativeFQN(sourceData: SourceData, fqn: string): string {
        let relativeFqn = fqn.replace(sourceData.projectRoot, ".");

        // local object: add source file path
        if(fqn === relativeFqn) {
          relativeFqn = '"' + sourceData.sourceFilePath.replace(sourceData.projectRoot, ".").replace(".ts", "") + '".' + relativeFqn;
        }
        return relativeFqn;
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
    
}