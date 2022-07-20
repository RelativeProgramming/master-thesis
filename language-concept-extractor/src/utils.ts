import * as fs from "fs";
import { Integer, QueryResult } from "neo4j-driver";
import * as path from "path";

export class Utils {
    /**
     * Returns the paths for all files with a given ending inside a directory. (scans recursively)
     * @param path path to the directory that shall be scanned
     * @param endings whitelist of endings of files that should
     * @param ignoredDirs directories that should not be scanned
     * @returns
     */
    static getFileList(path: string, endings: string[] = [], ignoredDirs: string[] = []): string[] {
        const allFiles = Utils.getAllFiles(path, [], ignoredDirs);
        return allFiles.filter((val) => {
            let match = false;
            for (const e of endings) {
                if (val.endsWith(e)) {
                    match = true;
                    break;
                }
            }
            return match;
        });
    }

    private static getAllFiles(dirPath: string, arrayOfFiles: string[] = [], ignoredDirs: string[] = []): string[] {
        const files = fs.readdirSync(dirPath);

        files.forEach(function (file) {
            if (fs.statSync(dirPath + "/" + file).isDirectory() && !ignoredDirs.includes(file)) {
                arrayOfFiles = Utils.getAllFiles(dirPath + "/" + file, arrayOfFiles, ignoredDirs);
            } else {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        });

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
        return res.records.map((rec) => rec.get(0));
    }
}
