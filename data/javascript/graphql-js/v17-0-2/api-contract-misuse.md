# Security cards

Repository: `https://github.com/graphql/graphql-js#v17.0.2`
Category: api contract misuse

## api contract misuse

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
