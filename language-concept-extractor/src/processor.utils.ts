import { ConceptMap, LCEConcept } from './concept';
import { LocalContexts } from './context';
import { Traverser, TraverserContext } from './traverser';

export function getAndDeleteChildConcepts<T extends LCEConcept>(propName: string, conceptId: string, childConcepts: ConceptMap): T[] {
    const propConcepts = childConcepts.get(propName);
    if(!propConcepts)
        return [];
    
    const result = propConcepts.get(conceptId) ?? [];
    propConcepts.delete(conceptId);
    if(propConcepts.size == 0)
        childConcepts.delete(propName);
    return (result as T[]);
}

export function getChildConcepts<T extends LCEConcept>(propName: string, conceptId: string, childConcepts: ConceptMap): T[] {
    const propConcepts = childConcepts.get(propName);
    if(!propConcepts)
        return [];
    const result = propConcepts.get(conceptId) ?? [];
    return (result as T[]);
}

export function getParentPropName(localContexts: LocalContexts): string {
    const traverserContext: TraverserContext = localContexts.currentContexts.get(Traverser.LOCAL_TRAVERSER_CONTEXT)!;
    return traverserContext.parentPropName;
}