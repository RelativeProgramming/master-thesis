import { AST_NODE_TYPES } from '@typescript-eslint/types';
import {Decorator} from '@typescript-eslint/types/dist/generated/ast-spec';
import { LCEDecorator } from '../concepts/decorator.concept';

/**
 * Transforms a given list of decorators from ESTree format into LCE format
 * @param esDecorators list of decorators provided in ESTree
 * @returns list of LCEDecorators with parsed information
 */
export function parseDecorators(esDecorators?: Decorator[]): LCEDecorator[] {
    const decorators: LCEDecorator[] = [];
    if(esDecorators) {
        for(let esDec of esDecorators) {
            let decoratorName: string = "";

            if(esDec.expression.type === AST_NODE_TYPES.Identifier) {
                decoratorName = esDec.expression.name;
            } else if(esDec.expression.type === AST_NODE_TYPES.CallExpression) {
                if(esDec.expression.callee.type === AST_NODE_TYPES.Identifier) {
                    decoratorName = esDec.expression.callee.name
                }
                // TODO: Implement more complex decorators with parameters
            }

            decorators.push({
                decoratorName: decoratorName
            });
        }
    }

    return decorators;
}