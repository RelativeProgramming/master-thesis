# Graph Structure

The following sections describe how different aspects of a TypeScript project are represented inside the Neo4j graph database.

Note:
→ has similar structure to [jQA Java Plugin](https://jqassistant.github.io/jqassistant/doc/1.11.1/manual/#java-plugin) 
→ all (partially) implemented features are checked


## TS Project
→ the directory containing the TypeScript Project
- [x]  Label: `:TS:Project`

Properties:
- `fileName` (already provided by default)

Relations:
- `CONTAINS`: contained files (already provided by default)
- [ ]  `REQUIRES`: references to external declarations

## TS Module
→ all .ts source files, each representing a module
- [x]  Label: `:TS:Module`

Relations:
- [x]  `DEPENDS_ON` references to all dependencies outside the module (modules and declarations)
  - [x]  attribute `cardinality` indicates the number of references made (added up transitively)
- [x]  `DECLARES` all declarations made inside the source module (e.g. classes, functions, etc.)
- [x]  `EXPORTS` all declarations that are exported by the module
    - [x]  attribute `exportedName` for potential aliases (or just the name of the declaration)

## tsconfig.json
→ configuration file of project
- [x]  Label: `:TS:ProjectConfiguration`

## External Module
→ all external modules used by inside the project
- [x]  Label: `:TS:Module:External`

Properties:
- [x]  `fileName` module path under which the reference was imported

Relations:
- [x]  `DECLARES` all declaration made inside the external module, that are referenced inside the project

## External Declaration
→ all declarations used by inside the project, that could not be resolved (i.e. came from external modules)
- [x]  Label: `:TS:ExternalDeclaration`

Properties:
- [x]  `fqn` fully qualified name under which the external reference was used
- [x]  `name` name of the external declaration

## Class Declaration
→ all `class` declarations inside TS files
- [x]  Label: `:TS:Class`

Properties:
- [x]  `fqn`: fully qualified name (e.g. `"./src/main.ts".MyComponent`)
- [x]  `name`: local name of the class
- [x]  `abstract` is class abstact (`abstract`)

Relations:
- [x]  `DECLARES`: all declared methods, properties and type parameters
- [x]  `DECORATED_BY`: all decorators on class level
- [x]  `EXTENDS`: super class type
- [x]  `IMPLEMENTS`: all interfaces that are implemented by class
- [x]  `DEPENDS_ON`: all internal and external declarations that are used within the class
  - [x]  attribute `cardinality` indicates the number of references made (added up transitively)

## Interface Declaration
→ all `interface` declarations inside TS files
- [x]  Label: `:TS:Interface`

Properties:
- [x]  `fqn`: fully qualified name (e.g. `"./src/main.ts".MyInterface`)
- [x]  `name`: local name of the interface

Relations:
- [x]  `DECLARES`: all declared methods, properties and type parameters
- [x]  `EXTENDS`: base interfaces
- [x]  `DEPENDS_ON`: all internal and external declarations that are used within the interface
  - [x]  attribute `cardinality` indicates the number of references made (added up transitively)

## Type Alias Declaration
→ all `type` declarations inside TS files
- [x]  Label: `:TS:TypeAlias`

Properties:
- [x]  `fqn`: fully qualified name (e.g. `"./src/main.ts".MyType`)
- [x]  `name`: local name of the type alias

Relations:
- [x]  `DECLARES`: all declared type parameters
- [x]  `OF_TYPE`: type the alias refers to
- [x]  `DEPENDS_ON`: all internal and external declarations that are used within the type alias
  - [x]  attribute `cardinality` indicates the number of references made (added up transitively)

## Enum Declaration
→ all `enum` declarations inside TS files
- [x]  Label: `:TS:Enum`

Properties:
- [x]  `fqn`: fully qualified name (e.g. `"./src/main.ts".MyEnum`)
- [x]  `name`: local name of the enum
- [x]  `constant`: indicates if the enum is constant
- [x]  `declared`: indicates if the enum is ambient

Relations:
- [x]  `DECLARES`: all declared enum members
  - [x]  attribute `index` indicates position of the enum member declaration
- [x]  `DEPENDS_ON`: all internal and external declarations that are used within the enum declaration
  - [x]  attribute `cardinality` indicates the number of references made (added up transitively)

## Enum Member
→ all members declared inside an `enum`
- [x]  Label: `:TS:EnumMember`

Properties:
- [x]  `fqn`: fully qualified name (e.g. `"./src/main.ts".MyEnum.MEMBER`)
- [x]  `name`: local name of the enum

Relations:
- [x]  `INITIALIZED_WITH`: initial value of the member (if explicitly specified)

## Variable Declaration
→ all variable declarations made on file level
- [x]  Label: `TS:Variable`

Properties:
- [x]  `fqn`: fully qualified name (e.g. `"./src/main.ts".doSth`)
- [x]  `name`: local name of the function
- [x]  `kind`: `var`, `let` or `const`

Relations:
- [x]  `OF_TYPE`: type of the declared variable
- [x]  `INITIALIZED_WITH`: initial value of the declared variable
- [x]  `DEPENDS_ON`: all internal and external declarations that are used by the property
  - [x]  attribute `cardinality` indicates the number of references made

## Function Declaration
→ all function declarations made on file level
- [x]  Label: `:TS:Function`

Properties:
- [x]  `fqn`: fully qualified name (e.g. `"./src/main.ts".doSth`)
- [x]  `name`: local name of the function

Relations:
- [x]  `RETURNS`: return type of the function
- [x]  `HAS`: references to parameters
- [x]  `DECLARES`: all declared type parameters
- [x]  `DEPENDS_ON`: all internal and external declarations that are used within the function
  - [x]  attribute `cardinality` indicates the number of references made (added up transitively)

## Property Declaration
→ all property declarations inside classes, interfaces or type aliases
- [x]  Label: `:TS:Property`

Properties:
- [x]  `name`: name of the property
- [x]  `fqn`: fully qualified name (e.g. `"./src/main.ts".MyClass.myProp`)
- [x]  `optional`: is property optional (`?`)
- [x]  `readonly`: is property read-only (`readonly`)
- [x]  `visibility`: specified visibility (`public`, `protected` or `private` or `js_private` for `#`)
- [x]  `static` is property static (`static`)
- [x]  `abstract` is property abstact (`abstract`)
- [x]  `override`: is property overridden from super class (using `override` keyword)

Relations:
- [x]  `OF_TYPE`: type of the property
- [x]  `DECORATED_BY`: all decorators of the property
- [x]  `DEPENDS_ON`: all internal and external declarations that are used by the property
  - [x]  attribute `cardinality` indicates the number of references made

## Method Declaration
→ all method declarations inside classes, interfaces or types
- [x]  Label: `:TS:Method`

Properties:
- [x]  `name`: name of the method
- [x]  `fqn`: fully qualified name (e.g. `"./src/main.ts".MyClass.myMethod`)
- [x]  `visibility`: specified visibility (`public`, `protected` or `private` or `js_private` for `#`)
- [x]  `static` is method static (`static`)
- [x]  `abstract` is method abstact (`abstract`)
- [x]  `override`: is method overridden from super class (using `override` keyword)

Relations:
- [x]  `RETURNS`: return type of the method
- [x]  `HAS`: references to parameters
- [x]  `DECORATED_BY`: all decorators of the method
- [x]  `DECLARES`: references to declared type parameters
- [x]  `DEPENDS_ON`: all internal and external declarations that are used within the method
  - [x]  attribute `cardinality` indicates the number of references made

Sub-Types:
- Constructor
  - [x]  Label: `:TS:Method:Constructor`
  - has no `name` and `override` attribute and has only `HAS` and `DEPENDS_ON` relations
  - can not be `js_private`
  - can declare parameter properties
    
- Getter
  - [x]  Label: `:TS:Method:Getter`
  - has no `HAS` relation
    
- Setter
  - [x]  Label: `:TS:Method:Setter`
  - has no `RETURNS` relation

## Parameter Declaration
→ all parameters declared by function or methods
- [x]  Label: `:TS:Parameter`

Properties:
- [x]  `index`: index of the parameter
- [x]  `name`: name of the parameter

Relations:
- [x]  `OF_TYPE`: reference to type of the parameter
- [x]  `DECORATED_BY`: all decorators decorating the parameter
- [x]  `DECLARES`: parameter property references (only for constructors)

## Decorator
→ all decorators decorating either classes, methods or properties
→ they are generally represented by Value nodes, that are referred to with the `DECORATED_BY` relation

## Type
→ represents a type (e.g. return type, property type, etc.)
- [x]  Label: `:TS:Type`

Has different variants, that can be composed:
### Primitive Types
- [x]  Label: `:TS:Type:Primitive`

Properties:
- [x]  `name`: identifier of the primitive type

### Declared Types (reference to class, interface or type alias)
- [x]  Label: `:TS:Type:Declared`

Properties:
- [x]  `referencedFqn`: fully qualified name of a class/interface/type alias
- [x]  `internal`: indicates whether type is declared inside project

Relations:
- [x]  `HAS_TYPE_ARGUMENT`: reference to potential type arguments
    - [x]  attribute `index`: position of the type argument
- [x]  `REFERENCES`: reference to declared class/interface/type alias (if internal)

### Union Types
- [x]  Label: `:TS:Type:Union`

Relations:
- [x]  `CONTAINS`: references to all constituent types

### Intersection Types
- [x]  Label: `:TS:Type:Intersection`

Relations:
- [x]  `CONTAINS`: references to all constituent types

### Object Types
- [x]  Label: `:TS:Type:Object`

Relations:
- [x]  `HAS_MEMBER`: references to all member types
    - [x]  attribute `name`: name of member

### Function Types
- [x]  Label: `:TS:Type:Function`

Properties:
- [x]  `arrowFunction`: indicates whether the value is an arrow function

Relations:
- [x]  `RETURNS`: reference to return type
- [x]  `HAS`: references to parameters (same node type as method parameters)
- [x]  `DECLARES`: references to declared type parameters

### Literal Types
- [x]  Label: `:TS:Type:Literal`

Properties:
- [x]  `value`: value of the Literal (either int or string)

### Tuple Types
- [x]  Label: `:TS:Type:Tuple`

Relations:
- [x]  `CONTAINS`: references to all constituent types
    - [x]  `index`: index of type in tuple

### Type Parameters (Generics)
→ all type parameters declared by a class, interface or function
- [x]  Label: `:TS:TypeParameter`

Properties:
- [x]  `index`: index of the type parameter in the type parameter list
- [x]  `name`: name of the type parameter (e.g. `T`)

Relations:
- [x]  `CONSTRAINED_BY`: constraint type of the type parameter

### Not Identified Types (everything that was not recognized)
- [x]  Label: `:TS:Type:NotIdentified`

Properties:
- [x]  `identifier`: string representation of type

## Value
→ represents an abitrary value, this can be any kind of expression
- [x]  Label: `:TS:Value`

Relations:
- [x]  `OF_TYPE`: type of the value (link to declaration types)

### Null Values
→ `undefined` or `null`
- [x]  Label: `:TS:Value:Null`

Properties:
- [x]  `kind`: either `undefined` or `null`

### Literal Values
→ any literal values (e.g. `true`, `32` or `"abc"`)
- [x]  Label: `:TS:Value:Literal`

Properties:
- [x]  `value`: value of the literal

### Declared Value
→ references to values declared elsewhere
- [x]  Label: `:TS:Value:Declared`

Properties:
- [x]  `referencedFqn`: fully qualified name of the variable/function/class referenced
- [x]  `internal`: indicates whether reference is declared inside project

Relations:
- [x]  `REFERENCES`: reference to declared variable/function/class (if internal)

### Member Value
→ any values that are the result of a member expression (e.g. `myObj.x`)
- [x]  Label: `:TS:Value:Member`

Relations:
- [x]  `PARENT`: parent value of which a member is accessed
- [x]  `MEMBER`: member value which is accessed

### Object Value
→ any values representing an object (e.g. `{a: 42, b: "abc"}`)
- [x]  Label: `:TS:Value:Object`

Relations:
- [x]  `HAS_MEMBER`: references to all member values
    - [x]  attribute `name`: name of member

### Array Value
→ any values representing an array (e.g. `[1, 2, 3]`)
- [x]  Label: `:TS:Value:Array`

Relations:
- [x]  `CONTAINS`: references to all item values
    - [x]  attribute `index`: index of the item

### Call Value
→ any values represented by a function call (e.g. `myArr.concat([4, 5])`)
- [x]  Label: `:TS:Value:Call`

Relations:
- [x]  `CALLS`: value that is called (e.g. `myArr.concat`)
- [x]  `HAS_ARGUMENT`: values of the arguments
  - [x]  attribute `index`: index of the argument
- [x]  `HAS_TYPE_ARGUMENT`: type arguments specified for call
  - [x]  attribute `index`: index of the type argument

### Function Value
→ any values representing a function (e.g. `function(x: string) { return x.trim(); }` or `(x: number) => x + 1`)
- [x]  Label: `:TS:Value:Function`

### Class Value
→ any values represented by a class expression (e.g. `class A {}`)
- [x]  Label: `:TS:Value:Class`

### Complex Values
→ any values that can't be resolved further
- [x]  Label: `:TS:Value:Complex`

Properties:
- [x]  `expression`: string of the value expression
