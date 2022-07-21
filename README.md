# Development of a Method to Model Language Concepts with Graph Structures

The main artifact available in this repository is the Languange Concept Extractor (LCE) for TypeScript (`./language-concept-extractor`).

## Setup
If not already installed, install the [`ts-node`](https://www.npmjs.com/package/ts-node) node application (e.g. via `npm install -g ts-node`).

To run the LCE execute the following commands in the project root directory:

1. Start jQA using `sh run-jqa.sh example-projects/2multiple` (do not close terminal instance!)
2. Execute LCE using `ts-node "./language-concept-extractor/src/main.ts" "./example-projects/2multiple"`

To reset the graph simply stop the jQA server and perform the steps above again.

To run the LCE for other example projects just modify the paths in the two commands.

The Neo4j browser can be reached under http://localhost:7474/browser/

## Graph Structure

see [Graph Structure Documentation](docs/graph_structure.md)