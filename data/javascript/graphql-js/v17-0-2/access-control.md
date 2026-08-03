# Security cards

Repository: `https://github.com/graphql/graphql-js#v17.0.2`
Category: access control

## access control

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
