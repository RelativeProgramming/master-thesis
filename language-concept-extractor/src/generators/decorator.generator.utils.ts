import { Integer, Session } from 'neo4j-driver';
import { LCEDecorator } from '../concepts/decorator.concept';
import { Utils } from '../utils';

export async function createDecoratorNode(deco: LCEDecorator, neo4jSession: Session): Promise<Integer> {
    const decoratorNodeProps = {
        name: deco.decoratorName
    }
    return Utils.getNodeIdFromQueryResult(await neo4jSession.run(
        `
        CREATE (decorator:TS:Decorator $decoratorProps)
        RETURN id(decorator)
        `, {decoratorProps: decoratorNodeProps}
    ));
}