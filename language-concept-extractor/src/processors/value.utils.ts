import { AST_NODE_TYPES } from '@typescript-eslint/types';
import { Expression } from '@typescript-eslint/types/dist/generated/ast-spec';
import LCEType from '../concepts/type.concept';
import LCEValue, { LCEValueCall, LCEValueComplex, LCEValueDeclared, LCEValueLiteral, LCEValueNull } from '../concepts/value.concept';
import { SourceData } from '../processor';
import Utils from '../utils';
import { parseExpressionType, parseTypeNode } from './type.utils';

export function parseValue(sourceData: SourceData, expr: Expression, varName?: string, parentFQN?: string): LCEValue {
    const tc = sourceData.typeChecker;
    const node = sourceData.services.esTreeNodeToTSNodeMap.get(expr);
    const symbol = tc.getSymbolAtLocation(node);
    const type = parseExpressionType(sourceData, expr, varName);

    if(expr.type === AST_NODE_TYPES.Literal) {

        if(expr.value === null)
            return new LCEValueNull(type, "null");
        return new LCEValueLiteral(type, expr.value);

    } else if(expr.type === AST_NODE_TYPES.Identifier) {

        if(expr.name === "undefined")
            return new LCEValueNull(type, "undefined");
        
        const inProject = Utils.isSymbolInProject(sourceData, symbol);
        let fqn;
        if(parentFQN)
            fqn = parentFQN + "." + expr.name;
        else
            fqn = Utils.getRelativeFQNForIdentifierESNode(sourceData, expr);
        // TODO: validate usefulness of parent FQN
        // FIXME: fix fqn system
        return new LCEValueDeclared(type, fqn, inProject);

    } else if(expr.type === AST_NODE_TYPES.CallExpression) {
        
        const callee = parseValue(sourceData, expr.callee, varName, parentFQN);
        const args: LCEValue[] = [];
        for(let arg of expr.arguments) {
            if(arg.type !== AST_NODE_TYPES.SpreadElement)
                args.push(parseValue(sourceData, arg, varName, parentFQN));
            else
                args.push(new LCEValueComplex(type, node.getFullText().trim()));
        }
        const typeArgs: LCEType[] = [];
        for(let typeArg of expr.typeParameters?.params ?? []) {
            typeArgs.push(parseTypeNode(sourceData, typeArg))
        }

        return new LCEValueCall(type, callee, args, typeArgs);

    } else if(expr.type === AST_NODE_TYPES.ObjectExpression) {
        // TODO: implement
    } else if(expr.type === AST_NODE_TYPES.ArrayExpression) {
        // TODO: implement
    } else if(expr.type === AST_NODE_TYPES.MemberExpression) {
        // TODO: implement
    } else if(expr.type === AST_NODE_TYPES.FunctionExpression) {
        // TODO: implement
    } else if(expr.type === AST_NODE_TYPES.ClassExpression) {
        // TODO: implement
    }

    // value could not be resolved
    return new LCEValueComplex(type, node.getFullText().trim());
}