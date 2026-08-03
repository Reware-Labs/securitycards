# Security cards

Repository: `https://github.com/graphql/graphql-js#v17.0.2`
Category: input contract definition

## input contract definition

### Validate Incoming GraphQL Operations Against the Schema Contract

**Use when**

Processing incoming GraphQL queries, mutations, and subscriptions before execution to ensure structural correctness and prevent malformed payloads.

**Secure rules**

**Rule 1: Pass parsed GraphQL document ASTs through validate() prior to execution.**

Always pass parsed GraphQL document ASTs through validate() with the target schema and check that the returned error array is empty before proceeding to execution. This ensures that invalid field selections, missing selection sets, scalar field selections, and invalid fragment spreads are rejected early.

```typescript
import { parse, validate, execute } from 'graphql';
import { schema } from './schema.js';

function handleRequest(queryString: string) {
  const document = parse(queryString);
  const validationErrors = validate(schema, document);
  if (validationErrors.length > 0) {
    return { errors: validationErrors };
  }
  return execute({ schema, document });
}
```

**Rule 2: Enforce required argument validation during document validation.**

Ensure that `ProvidedRequiredArgumentsRule` is retained in your validation pipeline so that required non-nullable arguments are strictly validated before execution.

```typescript
import { parse, validate, execute } from 'graphql';
import { ProvidedRequiredArgumentsRule } from 'graphql/validation';

const documentAST = parse(queryString);
const errors = validate(schema, documentAST, [ProvidedRequiredArgumentsRule]);

if (errors.length > 0) {
  console.error(errors);
}
```

**Rule 3: Validate overlapping fields can be merged during document validation.**

Ensure incoming GraphQL query documents are validated against the schema using `OverlappingFieldsCanBeMergedRule` prior to execution to verify that selection sets sharing response names or fragment spreads have non-conflicting types, arguments, and sub-selections.

```typescript
import { buildSchema, parse, validate, OverlappingFieldsCanBeMergedRule } from 'graphql';

const schema = buildSchema(`
  type Query {
    user: User
  }
  type User {
    id: ID!
    name: String
  }
`);

const documentNode = parse(`
  query {
    user {
      f1: id
      f1: name
    }
  }
`);

const errors = validate(schema, documentNode, [OverlappingFieldsCanBeMergedRule]);
if (errors.length > 0) {
  throw new Error(errors[0].message);
}
```

**Rule 4: Enforce known argument names during document validation.**

Validate all incoming GraphQL documents using schema validation rules like `KnownArgumentNamesRule` before executing queries to ensure that arguments on fields, fragments, and directives strictly match the schema contract.

```typescript
import { parse, validate, specifiedRules } from 'graphql';

const documentAST = parse(queryString);
const errors = validate(schema, documentAST, specifiedRules);

if (errors.length > 0) {
  throw new Error('GraphQL document validation failed');
}
```

**Rule 5: Validate fragment spread compatibility against schema composite types.**

Ensure query documents are validated with `PossibleFragmentSpreadsRule` prior to execution to reject invalid fragment spreads across non-overlapping composite types.

```typescript
import { validate, parse, specifiedRules } from 'graphql';

const document = parse(queryString);
const errors = validate(schema, document, specifiedRules);
if (errors.length > 0) {
  throw new Error('Validation failed');
}
```

**Rule 6: Validate fragment type conditions against composite schema types.**

Maintain `FragmentsOnCompositeTypesRule` within active validation rules to enforce that inline fragments and fragment definitions only target composite types.

```typescript
import { parse, validate, specifiedRules } from 'graphql';
import { FragmentsOnCompositeTypesRule } from 'graphql/validation';

const documentAST = parse(queryString);
const errors = validate(schema, documentAST, [...specifiedRules]);

if (errors.length > 0) {
}
```

**Rule 7: Include KnownDirectivesRule during validation to reject unauthorized directives.**

Ensure GraphQL query documents are validated against the schema using `KnownDirectivesRule` before execution to prevent unknown or misplaced directives from entering the execution phase.

```typescript
import { validate, parse, KnownDirectivesRule } from 'graphql';

const document = parse(queryString);
const errors = validate(schema, document, [KnownDirectivesRule]);
if (errors.length > 0) {
  throw new Error('Invalid GraphQL request: Unknown or misplaced directive.');
}
```

**Rule 8: Include KnownFragmentNamesRule during document validation.**

Ensure `KnownFragmentNamesRule` is active when validating GraphQL request documents prior to query execution to verify that all referenced fragments exist within the document.

```typescript
import { parse, validate, specifiedRules } from 'graphql';
import { KnownFragmentNamesRule } from 'graphql/validation';

const document = parse(queryString);
const errors = validate(schema, document, [...specifiedRules]);

if (errors.length > 0) {
}
```

**Rule 9: Validate operation types against schema before document execution.**

Ensure incoming GraphQL operation definitions are validated against the target schema using `KnownOperationTypesRule` before executing operations to guarantee that operation types are explicitly configured as root types.

```typescript
import { parse, validate, KnownOperationTypesRule } from 'graphql';

const documentAST = parse(queryString);
const errors = validate(schema, documentAST, [KnownOperationTypesRule]);

if (errors.length > 0) {
}
```

**Rule 10: Validate document type references before query execution.**

Ensure `KnownTypeNamesRule` is included during GraphQL document validation to verify that all referenced type names in query fragments, variable definitions, and schema definitions correspond to valid types.

```typescript
import { parse, validate, KnownTypeNamesRule } from 'graphql';

const document = parse(queryString);
const errors = validate(schema, document, [KnownTypeNamesRule]);
if (errors.length > 0) {
  throw new Error('Invalid document type references');
}
```

**Rule 11: Validate GraphQL operations to ensure all used variables are declared.**

Ensure GraphQL documents are validated using `NoUndefinedVariablesRule` before operation execution to verify that every variable referenced in arguments or directives is explicitly declared.

```typescript
import { parse, validate, NoUndefinedVariablesRule } from 'graphql';

const document = parse(requestQuery);
const validationErrors = validate(schema, document, [NoUndefinedVariablesRule]);

if (validationErrors.length > 0) {
}
```

**Rule 12: Validate operations to reject unused variable declarations.**

Include `NoUnusedVariablesRule` in your GraphQL validation pass to ensure operations and fragments do not declare variables that are never referenced in selection sets.

```typescript
import { buildSchema, parse, validate, specifiedRules } from 'graphql';
import { NoUnusedVariablesRule } from 'graphql/validation';

const schema = buildSchema(`
  type Query {
    field(arg: ID): String
  }
`);

const document = parse(`
  query ($id: ID, $unused: String) {
    field(arg: $id)
  }
`);

const errors = validate(schema, document, [...specifiedRules, NoUnusedVariablesRule]);
if (errors.length > 0) {
  throw new Error(`Validation failed: ${errors[0].message}`);
}
```

**Rule 13: Validate stream directives on list fields before query execution.**

Ensure `StreamDirectiveOnListFieldRule` is included when validating GraphQL operation documents that utilize incremental delivery stream directives to validate that `@stream` is applied only to list fields.

```typescript
import { parse } from 'graphql/language';
import { buildSchema } from 'graphql/utilities';
import { validate, StreamDirectiveOnListFieldRule } from 'graphql/validation';

const errors = validate(schema, document, [StreamDirectiveOnListFieldRule]);
if (errors.length > 0) {
  throw new Error('Invalid query document');
}
```

**Rule 14: Validate Operation Variables Are Restricted to Input Types.**

Ensure operation variables are restricted strictly to valid GraphQL input types by incorporating `VariablesAreInputTypesRule` during query validation.

```typescript
import { buildSchema, parse, validate, VariablesAreInputTypesRule } from 'graphql';

const schema = buildSchema(`
  type Query {
    field(arg: ID): String
  }
  type User {
    name: String
  }
`);

const document = parse(`
  query ($user: User) { field(arg: "1") }
`);

const errors = validate(schema, document, [VariablesAreInputTypesRule]);
if (errors.length > 0) {
  throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
}
```

**Rule 15: Enforce ExecutableDefinitionsRule to reject non-executable definitions in query payloads.**

Ensure `ExecutableDefinitionsRule` is active during document validation so that incoming request documents contain only executable operation and fragment definitions.

```typescript
import { validate, specifiedRules } from 'graphql';
import { ExecutableDefinitionsRule } from 'graphql/validation';

const errors = validate(schema, documentAST, specifiedRules);
if (errors.length > 0) {
  throw new Error('Invalid GraphQL request document');
}
```

**Rule 16: Enforce NoUnusedFragmentsRule to reject unused fragment definitions.**

When validating incoming untrusted GraphQL queries, include `NoUnusedFragmentsRule` to enforce the requirement that every fragment definition must be used.

```typescript
import { buildSchema, parse, validate, specifiedRules } from 'graphql';
import { NoUnusedFragmentsRule } from 'graphql/validation';

const schema = buildSchema(`type Query { name: String }`);
const document = parse(`
  fragment Unused on Query { name }
  query { name }
`);

const errors = validate(schema, document, specifiedRules);
if (errors.length > 0) {
}
```

**Rule 17: Validate query document fragment uniqueness before execution.**

Ensure documents are validated with `UniqueFragmentNamesRule` before execution to enforce fragment name uniqueness and prevent ambiguous fragment resolution.

```typescript
import { buildSchema, parse, validate } from 'graphql';
import { UniqueFragmentNamesRule } from 'graphql/validation';

const schema = buildSchema(`type Query { name: String }`);
const document = parse(`
  fragment A on Query { name }
  fragment A on Query { name }
  query { ...A }
`);

const errors = validate(schema, document, [UniqueFragmentNamesRule]);
if (errors.length > 0) {
  throw new Error('Validation failed');
}
```

**Rule 18: Enforce UniqueVariableNamesRule to prevent ambiguous query variable declarations.**

Ensure all incoming GraphQL operations undergo document validation using `UniqueVariableNamesRule` to reject operation definitions declaring duplicate variable names.

```typescript
import { buildSchema, parse, validate, SpecifiedRules } from 'graphql';

const schema = buildSchema(`
  type Query {
    field(arg: ID): String
  }
`);

const documentAST = parse(`
  query GetField($id: ID) {
    field(arg: $id)
  }
`);

const errors = validate(schema, documentAST, SpecifiedRules);
if (errors.length > 0) {
  console.error('Validation errors:', errors);
}
```

**Rule 19: Validate root fields against defer and stream directives.**

Ensure GraphQL query validation enforces `DeferStreamDirectiveOnRootFieldRule` to reject requests that attempt to apply `@defer` or `@stream` directives to root fields.

```typescript
import { parse, validate, specifiedRules, DeferStreamDirectiveOnRootFieldRule } from 'graphql';

const errors = validate(schema, document, [...specifiedRules]);
if (errors.length > 0) {
}
```


### Validate Untrusted Input Objects and Arguments Against Schema Contracts

**Use when**

Validating client-provided input objects, variable values, and arguments against strict schema constraints and input types before application processing.

**Secure rules**

**Rule 1: Validate untrusted input objects against strict OneOf constraints.**

Ensure all client-provided input objects and AST literals are validated through `validateInputValue` or `validateInputLiteral` before passing inputs to application logic, ensuring strict adherence to OneOf input object rules.

```javascript
import { validateInputValue } from 'graphql/utilities';
import { OneOfInputType } from './schema.js';

const validationErrors = [];
validateInputValue(
  rawInputData,
  OneOfInputType,
  (error, path) => {
    validationErrors.push({ error, path });
  },
  true
);

if (validationErrors.length > 0) {
  throw new Error('Input validation failed due to schema contract mismatch.');
}
```

**Rule 2: Enforce input type validation and non-null argument constraints.**

Use `GraphQLInputObjectType` to structure multi-field inputs and wrap required arguments with `GraphQLNonNull`, specifying default values properly using the `{ value }` or `{ literal }` property shape.

```js
import { GraphQLInputObjectType, GraphQLNonNull, GraphQLString } from 'graphql';

const MessageInput = new GraphQLInputObjectType({
  name: 'MessageInput',
  fields: {
    content: { type: new GraphQLNonNull(GraphQLString) },
    author: {
      type: GraphQLString,
      default: { value: 'Anonymous' },
    },
  },
});

const createMessageField = {
  type: Message,
  args: {
    input: { type: new GraphQLNonNull(MessageInput) },
  },
  resolve: (_, { input }) => {
    return saveMessage(input);
  },
};
```

**Rule 3: Use isOneOf input objects to enforce mutually exclusive input fields.**

When defining input types that accept mutually exclusive input options, configure `GraphQLInputObjectType` with `isOneOf: true` to strictly enforce that exactly one field is provided.

```javascript
const TargetIdentityInput = new GraphQLInputObjectType({
  name: 'TargetIdentityInput',
  isOneOf: true,
  fields: {
    byUserId: { type: GraphQLInt },
    byEmail: { type: GraphQLString },
  },
});
```

**Rule 4: Enforce Unique Type Names Across Schema Definitions.**

Ensure all types defined or imported into a `GraphQLSchema` have strictly unique names without overriding built-in scalars or duplicating type names.

```javascript
const UniqueCustomScalar = new GraphQLScalarType({
  name: 'CustomScalarName',
});

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      customField: { type: UniqueCustomScalar },
    },
  }),
});
```
