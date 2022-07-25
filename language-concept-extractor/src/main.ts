import { processProject } from "./core/extractor";
import { initializeReactExtractor } from "./react/react-extractor";

initializeReactExtractor();
processProject(process.argv[2]);
