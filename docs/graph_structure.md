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
- [ ]  `REQUIRES`: references to external types, etc.

## TS Source File
→ all .ts source files
- [x]  Label: `:TS:SourceFile`

Relations:
- [ ]  `DEPENDS_ON` references to all dependencies outside the file (files and declarations)
- [x]  `DECLARES` all declarations made inside the source file (e.g. Classes, Functions, etc.)
- [ ]  `EXPORTS` all declarations that are exported by the file
    - [ ]  attribute `exportedName` for potential aliases

## tsconfig.json
→ configuration file of project
- [x]  Label: `:TS:ProjectConfiguration`

## Class Declaration
→ all `class` declarations inside TS files
- [x]  Label: `:TS:Class`

Properties:
- [x]  `fqn`: fully qualified name (e.g. `"./src/main.ts".MyComponent`)
- [x]  `name`: local name of the class
- [x]  `sourceFilePath`: path to source file

Relations:
- [x]  `DECLARES`: all declared methods, properties and type parameters
- [x]  `DECORATED_BY`: all decorators on class level
- [ ]  `EXTENDS`: super class
- [ ]  `IMPLEMENTS`: all interfaces that are implemented by class

## Interface Declaration
→ all `interface` declarations inside TS files
- [x]  Label: `:TS:Interface`

Properties:
- [x]  `fqn`: fully qualified name (e.g. `"./src/main.ts".MyInterface`)
- [x]  `name`: local name of the interface
- [x]  `sourceFilePath`: path to source file

Relations:
- [x]  `DECLARES`: all declared methods, properties and type parameters
- [ ]  `EXTENDS`: base interfaces

## Type Alias Declaration (TODO)

## Function/Variable Declaration (TODO)

## Property Declaration
→ all property declarations inside classes, interfaces or type aliases
- [x]  Label: `:TS:Property`

Properties:
- [x]  `name`: name of the property
- [x]  `optional`: is property optional (`?`)
- [x]  `readonly`: is property read-only (`readonly`)
- [x]  `visibility`: specified visibility (`public`, `protected` or `private` or `js_private` for `#`)

Relations:
- [x]  `OF_TYPE`: type of the property
- [x]  `DECORATED_BY`: all decorators of the property

## Method Declaration
→ all method declarations inside classes, interfaces or types
- [x]  Label: `:TS:Method`

Properties:
- [x]  `name`: name of the method
- [x]  `visibility`: specified visibility (`public`, `protected` or `private` or `js_private` for `#`)

Relations:
- [x]  `RETURNS`: return type of the method
- [x]  `HAS`: references to parameters
- [x]  `DECORATED_BY`: all decorators of the method
- [x]  `DECLARES`: references to declared type parameters
- [ ]  `DEPENDS_ON`: all internal and external declarations that are used within the method

Sub-Types:
- Constructor
  - [x]  Label: `:TS:Method:Constructor`
  - has no `name` attribute and has only `HAS` and `DEPENDS_ON` relations
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
- [x]  Label: `:TS:Decorator`

Properties:
- [x]  `name`: name of the decorator

## Instructional Code (TODO)

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
- [x]  `fqn`: fully qualified name of a class/interface/type alias
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
