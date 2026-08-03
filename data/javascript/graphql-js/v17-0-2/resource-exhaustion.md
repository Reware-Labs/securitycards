# Security cards

Repository: `https://github.com/graphql/graphql-js#v17.0.2`
Category: resource exhaustion

## resource exhaustion

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
