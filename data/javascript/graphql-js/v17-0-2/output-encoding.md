# Security cards

Repository: `https://github.com/graphql/graphql-js#v17.0.2`
Category: output encoding

## output encoding

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
