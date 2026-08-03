# Security cards

Repository: `https://github.com/graphql/graphql-js#v17.0.2`
Category: authentication

## authentication

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
