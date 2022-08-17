import { GENERATORS, PROCESSORS } from "../core/features";
import { ReactComponentGenerator } from "./generators/react-component.generator";
import { ReactHookGenerator } from './generators/react-hook.generator';
import { ReactHookProcessor } from './processors/react-hook.processor';

export function initializeReactExtractor() {
    console.log("Initializing React Extractor...");

    PROCESSORS.push(new ReactHookProcessor());

    GENERATORS.push(new ReactComponentGenerator());
    GENERATORS.push(new ReactHookGenerator());
}
