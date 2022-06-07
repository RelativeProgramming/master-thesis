import { AST_NODE_TYPES } from '@typescript-eslint/types';
import { ClassDeclaration } from '@typescript-eslint/types/dist/generated/ast-spec';
import { Concept } from '../concepts';
import LCEClassDeclarationIndex, { LCEClassDeclaration } from '../concepts/class-declaration.concept';
import { LCEDecorator } from '../concepts/decorator.concept';
import { LCETypeParameterDeclaration } from '../concepts/type-parameter.concept';
import { BaseProcessor, SourceData } from '../processor';
import Utils from '../utils';
import { parseMembers } from './class-like-declaration.utils';
import { parseDecorators } from './decorator.utils';
import { parseClassTypeParameters } from './type.utils';

export default class ClassDeclarationProcessor implements BaseProcessor {

    requiredConcepts: Concept[] = [];

    providedConcepts: Concept[] = [Concept.CLASS_DECLARATIONS];

    run(sourceData: SourceData, concepts: Map<Concept, any>): void {
        if(!concepts.has(Concept.CLASS_DECLARATIONS)) {
            concepts.set(Concept.CLASS_DECLARATIONS, new LCEClassDeclarationIndex())
        }
        const index: LCEClassDeclarationIndex = concepts.get(Concept.CLASS_DECLARATIONS);
        const decls = index.declarations;

        for(let statement of sourceData.ast.body) {
            if(statement.type === AST_NODE_TYPES.ClassDeclaration) {
                // plain class declaration inside a TS file
                const [fqn, cl] = this.processClassDeclaration(statement, sourceData);
                decls.set(fqn, cl);
            } else if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration && 
                statement.declaration !== undefined && 
                statement.declaration?.type === AST_NODE_TYPES.ClassDeclaration) {
                // class declaration that is directly exported
                const [fqn, cl] = this.processClassDeclaration(statement.declaration, sourceData);
                decls.set(fqn, cl);
            }
        }
    }

    /** converts a given ESTree ClassDeclaration into a Class model object along with its FQN */
    private processClassDeclaration(classDecl: ClassDeclaration, sourceData: SourceData): [string, LCEClassDeclaration] {
        const fqn = Utils.getRelativeFQNForESNode(sourceData, classDecl);

        // Class Decorator Parsing
        const decorators: LCEDecorator[] = parseDecorators(classDecl.decorators);

        // Class Type Parameter Parsing
        const typeParameters: LCETypeParameterDeclaration[] = parseClassTypeParameters(sourceData, classDecl);

        // Fields and Method Parsing
        const [methods, properties, getters, setters, constr] = parseMembers(classDecl, sourceData);

        return [fqn, {
            className: classDecl.id!.name,
            typeParameters: typeParameters,
            constr: constr,
            properties: properties,
            methods: methods,
            getters: getters,
            setters: setters,
            decorators: decorators,
            sourceFilePath: sourceData.sourceFilePath
        }];
    }
}
