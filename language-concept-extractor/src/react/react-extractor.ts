import { GENERATORS } from "../core/features";
import { ReactComponentGenerator } from "./generators/react-component.generator";

export function initializeReactExtractor() {
    console.log("Initializing React Extractor...");

    GENERATORS.push(new ReactComponentGenerator());
}
