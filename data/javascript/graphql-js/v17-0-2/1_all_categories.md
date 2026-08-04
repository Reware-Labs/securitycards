# Security cards

Repository: `https://github.com/graphql/graphql-js#v17.0.2`

## Category: access control

### Enforce Field-Level Access Control and Tenant Isolation in GraphQL Resolvers

**Use when**

Use when implementing resolvers, domain logic, or field-level authorization checks to ensure that authenticated users can only access authorized resources and data records.

**Secure rules**

**Rule 1: Attach user identity metadata to the request context and verify record ownership or permissions inside field resolvers.**

Pass client authorization metadata via the GraphQL context object, and verify user permissions within field resolvers or business logic functions to prevent unauthorized access to nested resources.

```js
function Post_body(source, args, context, info) {
  return postRepository.getBody({ user: context.user, post: source });
}
```

**Rule 2: Enforce access control rules in the application domain and business logic layer.**

Delegate access control checks to your application's domain and business logic layer rather than relying exclusively on top-level endpoint checks or duplicating checks across multiple resolvers.

```js
export const resolvers = {
  Mutation: {
    deleteUser: (parent, args, context) => {
      return userService.deleteUser({ id: args.id, currentUser: context.user });
    },
  },
};
```

**Rule 3: Inspect custom schema directive values using `getDirectiveValues` to enforce authorization rules.**

Explicitly enforce custom schema directives using `getDirectiveValues` because GraphQL.js treats directives solely as metadata annotations without executing them by default.

```js
import { getDirectiveValues } from 'graphql';

function withAuthCheck(resolverFn, schema, fieldNode, variableValues, context) {
  const directive = getDirectiveValues(
    schema.getDirective('auth'),
    fieldNode,
    variableValues
  );

  if (directive?.role && context.user?.role !== directive.role) {
    throw new Error('Unauthorized');
  }

  return resolverFn();
}
```

**Rule 4: Pass custom context executors to background event streaming functions to maintain tenant and authorization context.**

When using `mapSourceToResponseEvent` with low-level subscription APIs, supply a custom executor wrapper to ensure authorization metadata, request context, or cancellation signals are consistently applied to every pushed event.

```js
import {
  createSourceEventStream,
  executeSubscriptionEvent,
  mapSourceToResponseEvent,
  validateSubscriptionArgs,
} from 'graphql';

const validatedArgs = validateSubscriptionArgs({
  schema,
  document,
  contextValue,
  variableValues,
});

if ('schema' in validatedArgs) {
  const source = await createSourceEventStream(validatedArgs);
  if (source && typeof source[Symbol.asyncIterator] === 'function') {
    const stream = mapSourceToResponseEvent(
      validatedArgs,
      source,
      (validatedEventArgs) =>
        executeSubscriptionEvent({
          ...validatedEventArgs,
          contextValue: {
            ...validatedEventArgs.contextValue,
            eventTimestamp: Date.now(),
          },
        }),
    );
  }
}
```

**Rule 5: Instantiate DataLoader instances per request within a context factory to prevent cross-user data leaks.**

Avoid defining global or module-scoped DataLoader instances, which share cached objects across requests and can result in authorization bypasses and unauthorized data leaks between users.

```js
function createContext() {
  return {
    userLoader: new DataLoader(async (userIds) => {
      const users = await getUsersByIds(userIds);
      return userIds.map(id => users.find(user => user.id === id) || null);
    }),
  };
}

const result = await graphql({
  schema,
  source: query,
  contextValue: createContext(),
});
```

**Rule 6: Partition cache keys using user identifiers or authentication tokens when caching responses or resolver outputs.**

Avoid sharing global resolver-level or operation result caches across operations when handling authorization-sensitive data, and ensure cache keys partition data strictly by user identity.

```js
function getCacheKey(req, query, variables) {
  const userId = req.user ? req.user.id : 'public';
  return `${userId}:${JSON.stringify({ query, variables })}`;
}
```


## Category: api contract misuse

### Validate execution and subscription arguments upfront with dedicated v17 helpers

**Use when**

When executing queries, incremental schemas, or subscriptions using low-level execution helpers in GraphQL.js v17.0.2.

**Secure rules**

**Rule 1: Validate and normalize execution arguments using validateExecutionArgs() before invoking root execution or incremental execution functions.**

Always pass execution arguments through `validateExecutionArgs()` prior to calling functions such as `executeRootSelectionSet()` or `experimentalExecuteIncrementally()`. This ensures arguments conform strictly to expected types and prevents runtime exceptions or contract bypasses.

```typescript
import { experimentalExecuteIncrementally, validateExecutionArgs, parse } from 'graphql';

const validatedArgs = validateExecutionArgs({
  schema,
  document: parse('query { field ... @defer { deferredField } }'),
});

if ('schema' in validatedArgs) {
  const result = await experimentalExecuteIncrementally(validatedArgs);
} else {
  // Handle validation errors returned as GraphQLError array
}
```

**Rule 2: Normalize and validate subscription arguments with validateSubscriptionArgs() before creating source event streams.**

When handling subscriptions with low-level helpers, explicitly validate execution arguments using `validateSubscriptionArgs()` before passing them to `createSourceEventStream()`. Omitting this validation step triggers runtime exceptions.

```typescript
const validatedArgs = validateSubscriptionArgs(executionArgs);
if ('schema' in validatedArgs) {
  const sourceStream = await createSourceEventStream(validatedArgs);
} else {
  // Handle schema validation errors
}
```


## Category: authentication

### Propagate Authenticated User State into the GraphQL Execution Context

**Use when**

Setting up the GraphQL request handler to verify and forward user identity and request credentials into the execution context.

**Secure rules**

**Rule 1: Pass a dynamic context function to the request handler to authenticate requests and attach caller identity per request.**

Ensure that authentication credentials are verified and forwarded from incoming requests into the GraphQL execution context so that field resolvers have access to valid user identity and metadata without leaking authorization state across requests.

```js
import { createHandler } from 'graphql-http/lib/use/express';

app.all(
  '/graphql',
  createHandler({
    schema,
    context: async (req) => {
      const user = await authenticateUser(req);
      return { user };
    },
  }),
);
```


## Category: boundary control

### Enforce Schema Introspection Restrictions for Public Requests

**Use when**

When building GraphQL validation rules for unauthenticated or public requests where unauthorized callers must not be allowed to inspect the full schema structure.

**Secure rules**

**Rule 1: Restrict schema introspection by appending `NoSchemaIntrospectionCustomRule` to validation rules for public requests.**

To prevent unauthenticated callers from enumerating your schema, conditionally append `NoSchemaIntrospectionCustomRule` from `graphql` to the validation rules array whenever handling public requests.

```js
import { specifiedRules, NoSchemaIntrospectionCustomRule } from 'graphql';

const validationRules = isPublicRequest
  ? [...specifiedRules, NoSchemaIntrospectionCustomRule]
  : specifiedRules;
```


## Category: escape hatch

### Restrict unconstrained JSON scalars with explicit runtime validation

**Use when**

Defining custom scalars like `GraphQLScalarType` that accept arbitrary or unconstrained JSON payloads.

**Secure rules**

**Rule 1: Validate input values explicitly within custom scalar definitions to prevent raw, unconstrained payloads from bypassing type-checking safeguards.**

Implement `coerceInputValue` inside the `GraphQLScalarType` configuration to inspect incoming values at runtime and throw an appropriate error when structural or type expectations are violated.

```typescript
import { GraphQLScalarType } from 'graphql';

const ValidatedJSON = new GraphQLScalarType({
  name: 'ValidatedJSON',
  coerceInputValue(value) {
    if (typeof value !== 'object' || value === null) {
      throw new TypeError('Expected non-null JSON object');
    }
    return value;
  },
});
```


## Category: input contract definition

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


## Category: input interpretation safety

### Handle Scalar Encoding Divergence in AST Value Conversions for `GraphQLID`

**Use when**

When converting runtime JavaScript values to GraphQL AST literals using `astFromValue` with `GraphQLID` to ensure downstream consumers safely process varying literal node kinds.

**Secure rules**

**Rule 1: Handle both `IntValue` and `StringValue` AST node kinds explicitly when processing AST literals produced for `GraphQLID` types to prevent encoding confusion.**

When generating AST literals from external or runtime values using `astFromValue`, account for scalar type conversion rules where numeric strings without leading zeros are coerced into `IntValue` AST literals while others remain `StringValue` AST literals. Update your downstream query generators and AST consumers to explicitly handle both node kinds.

```typescript
import { GraphQLID } from 'graphql';
import { astFromValue } from 'graphql/utilities';

const astNode = astFromValue('123', GraphQLID);
// astNode is { kind: 'IntValue', value: '123' }
// Handle both 'IntValue' and 'StringValue' kinds safely in AST processing
```


### Safely Parse and Normalize Untrusted GraphQL Inputs and Query Strings

**Use when**

When decoding, parsing, normalizing, and canonicalizing untrusted representations and query strings so security decisions use one unambiguous interpretation.

**Secure rules**

**Rule 1: Allow the lexer and parser to handle input validation and properly catch GraphQLError exceptions when processing untrusted query strings.**

Pass untrusted query strings to the GraphQL parser or lexer and handle resulting GraphQLError syntax errors gracefully rather than manually altering token boundaries.

```typescript
import { parse, Source, GraphQLError } from 'graphql';

function safeParseQuery(queryString: string) {
  try {
    const source = new Source(queryString, 'GraphQL-Request');
    return parse(source);
  } catch (error) {
    if (error instanceof GraphQLError) {
      return { errors: [error.toJSON()] };
    }
    throw error;
  }
}
```

**Rule 2: Safely normalize GraphQL query strings using stripIgnoredCharacters to preserve token boundaries.**

Rely on stripIgnoredCharacters to remove comments, commas, BOM, and unneeded whitespace while strictly preserving string literal contents and required spaces between non-punctuator tokens.

```typescript
import { stripIgnoredCharacters } from 'graphql';

const rawQuery = `
  query GetUser {
    user(id: "123 # not a comment") {
      name
      role
    }
  }
`;

const normalizedQuery = stripIgnoredCharacters(rawQuery);
```

**Rule 3: Handle syntax errors when normalizing GraphQL documents with stripIgnoredCharacters.**

Wrap calls to stripIgnoredCharacters in error handling to catch lexer syntax errors when processing untrusted query strings.

```typescript
import { stripIgnoredCharacters } from 'graphql';

try {
  const minifiedQuery = stripIgnoredCharacters(untrustedQueryString);
} catch (error) {

}
```


## Category: interface protocol hardening

### Configure Explicit CORS and Body Parser Middleware for Protocol Enforcement

**Use when**

Configuring HTTP endpoints and server-level middleware for GraphQL handlers to ensure expected protocol behavior, request methods, and content types.

**Secure rules**

**Rule 1: Configure explicit CORS and body parser middleware before attaching the GraphQL handler.**

Explicitly apply standard middleware such as `cors` and `express.json()` prior to mounting the `createHandler` endpoint to enforce correct method and content type handling.

```js
import express from 'express';
import cors from 'cors';
import { createHandler } from 'graphql-http/lib/use/express';

const app = express();

app.use(cors());
app.use(express.json());
app.all('/graphql', createHandler({ schema }));
```


## Category: output encoding

### Sanitize and Format GraphQL Execution Errors in Production

**Use when**

When configuring error handling for GraphQL execution to prevent leaking internal stack traces and system details in production environments.

**Secure rules**

**Rule 1: Mask internal error stack traces and sensitive system details by implementing a custom error formatter function in production.**

Define a custom error formatting function that checks whether the environment is set to production and returns a sanitized generic error message instead of exposing detailed `GraphQLError` instances or unhandled exceptions.

```js
import { GraphQLError } from 'graphql';

function formatError(error) {
  if (process.env.NODE_ENV === 'production') {
    return new GraphQLError('Internal server error');
  }
  return error;
}
```


## Category: resource exhaustion

### Enforce Query Complexity, Depth, Parser, and Validation Limits

**Use when**

Parsing and validating incoming untrusted GraphQL query strings or documents to protect server resources against denial-of-service and resource exhaustion attacks.

**Secure rules**

**Rule 1: Set a strict maximum token limit during document parsing.**

Pass a `maxTokens` limit in `ParseOptions` when calling `parse()` on untrusted input strings to prevent quadratic CPU and memory consumption during lexing and parsing.

```typescript
import { parse } from 'graphql';

const document = parse(untrustedGraphQLString, {
  maxTokens: 2000,
});
```

**Rule 2: Cap maximum validation errors to prevent traversal DoS.**

Configure `maxErrors` when invoking `validate()` to cap the total number of validation errors allowed before AST traversal aborts.

```typescript
import { parse } from 'graphql/language';
import { validate } from 'graphql/validation';

const errors = validate(schema, documentAST, undefined, {
  maxErrors: 50,
});

if (errors.length > 0) {
  // Handle validation failures
}
```

**Rule 3: Limit variable coercion errors using max errors option.**

Supply `maxErrors` in the options parameter when invoking `getVariableValues()` to cap the maximum number of variable coercion errors collected.

```typescript
import { getVariableValues } from 'graphql/execution';

const result = getVariableValues(
  schema,
  operation.variableDefinitions,
  rawInputVariables,
  { maxErrors: 10 }
);

if ('errors' in result) {
  // Handle or report bounded errors
}
```

**Rule 4: Enforce static operation complexity limits before execution.**

Pass complexity validation rules into the `graphql` function or `validationRules` array so that queries exceeding structural cost thresholds are blocked before any field resolvers execute.

```javascript
import { graphql, specifiedRules, parse } from 'graphql';
import { createComplexityRule, simpleEstimator } from 'graphql-query-complexity';
import { schema } from './schema.js';

const source = `query { users { id posts { title } } }`;

const result = await graphql({
  schema,
  source,
  validationRules: [
    ...specifiedRules,
    createComplexityRule({
      estimators: [simpleEstimator({ defaultComplexity: 1 })],
      maximumComplexity: 50,
    }),
  ],
});
```

**Rule 5: Enforce MaxIntrospectionDepthRule to prevent recursive introspection resource exhaustion.**

Include `MaxIntrospectionDepthRule` in custom validation rules passed to `validate()` to enforce depth limits on introspection queries.

```typescript
import { buildSchema, parse, validate, specifiedRules } from 'graphql';
import { MaxIntrospectionDepthRule } from 'graphql/validation';

const schema = buildSchema(`
  type Query {
    me: User
  }
  type User {
    id: ID!
    friends: [User!]
  }
`);

const queryAST = parse(`
  query RecursiveIntrospection {
    __schema {
      types {
        fields {
          type {
            fields {
              type {
                fields {
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`);

const errors = validate(schema, queryAST, [
  ...specifiedRules,
  MaxIntrospectionDepthRule,
]);

if (errors.length > 0) {
  console.error('Validation failed:', errors);
}
```

**Rule 6: Validate operations with NoFragmentCyclesRule to prevent execution loops.**

Always execute GraphQL validation rules including `NoFragmentCyclesRule` on incoming GraphQL operation documents prior to execution to reject cyclic fragment spreads.

```typescript
import { buildSchema, parse, validate, specifiedRules } from 'graphql';
import { NoFragmentCyclesRule } from 'graphql/validation';

const document = parse(queryString);
const errors = validate(schema, document, [...specifiedRules, NoFragmentCyclesRule]);
if (errors.length > 0) {
  // Reject query processing
}
```


### Limit recursive fragment expansion during validation

**Use when**

When building custom validation rules for GraphQL documents to prevent excessive resource consumption from deeply nested or overlapping fragment spreads.

**Secure rules**

**Rule 1: Enforce strict upper bounds on recursively referenced fragments using ASTValidationContext.**

Inspect operations using `context.getRecursivelyReferencedFragments(node)` inside custom validation rules and report a validation error if the number of expanded fragments exceeds configured safety limits to prevent fragment amplification attacks.

```ts
import { GraphQLError } from 'graphql/error';
import type { ASTValidationContext } from 'graphql/validation';

const MAX_ALLOWED_FRAGMENTS = 10;

export function LimitFragmentExpansionRule(context: ASTValidationContext) {
  return {
    OperationDefinition(node) {
      const fragments = context.getRecursivelyReferencedFragments(node);
      if (fragments.length > MAX_ALLOWED_FRAGMENTS) {
        context.reportError(
          new GraphQLError(
            `Operation expands into ${fragments.length} fragments, exceeding the maximum limit of ${MAX_ALLOWED_FRAGMENTS}.`,
            { nodes: [node] }
          )
        );
      }
    },
  };
}
```


### Manage Execution Timeouts, Cancellation, and Resolver Resource Limits

**Use when**

Executing GraphQL queries, mutations, or subscriptions while handling client disconnections, timeouts, and resource cleanup.

**Secure rules**

**Rule 1: Pass an AbortSignal to prevent server resource exhaustion.**

Pass an `AbortSignal` via `GraphQLArgs.abortSignal` to `graphql()` to enable execution cancellation upon request timeouts or client disconnections.

```typescript
const controller = new AbortController();

const result = await graphql({
  schema,
  source,
  abortSignal: controller.signal,
});
```

**Rule 2: Batch resolver lookups to avoid resource exhaustion from N+1 queries.**

Wrap nested entity lookups in `DataLoader` batch functions and invoke `context.loader.load(id)` inside resolvers to group lookups into single batched requests.

```typescript
const PostType = new GraphQLObjectType({
  name: 'Post',
  fields: () => ({
    id: { type: GraphQLID },
    author: {
      type: UserType,
      resolve(post, args, context) {
        return context.userLoader.load(post.authorId);
      },
    },
  }),
});
```


## Category: security control integrity

### Validate Schemas and Preserve Default Rules During GraphQL Execution

**Use when**

When initializing GraphQL schemas, constructing custom execution pipelines, or configuring validation rules to prevent security control bypasses and unvalidated inputs.

**Secure rules**

**Rule 1: Run schema validation explicitly and preserve default specification rules to maintain runtime integrity.**

Always run schema validation checks such as `assertValidSchema()` or `validateSchema()` when constructing or extending GraphQL schemas, and ensure that standard validation rules like `specifiedRules` are preserved when adding custom constraints to prevent malformed schemas and bypasses.

```javascript
import { assertValidSchema, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      health: { type: GraphQLString },
    },
  }),
});

assertValidSchema(schema);
```

**Rule 2: Check execution error arrays and validate documents prior to custom pipeline execution.**

Explicitly inspect the `result.errors` array on execution results to handle partial execution failures and authorization errors rather than relying solely on successful promises, and execute document validation before invoking low-level execution helpers.

```javascript
import { execute, parse } from 'graphql';

const result = await execute({
  schema,
  document: parse('query { sensitiveData }'),
  contextValue,
});

if (result.errors && result.errors.length > 0) {
  console.error('Execution errors occurred:', result.errors);
}
```
