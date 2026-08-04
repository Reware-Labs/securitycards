# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: authentication

## authentication

### Perform Token and Credential Authentication in preValidation Hooks

**Use when**

When registering routes that require verification of identity credentials or tokens in Fastify applications.

**Secure rules**

**Rule 1: Execute token and credential verification within Fastify preValidation hooks rather than the route handler.**

Run credential authentication checks using `preValidation` hooks. This pattern rejects unauthenticated requests before Fastify executes JSON schema validation or the route handler. Request body parsing occurs before `preValidation`, so configure appropriate body size limits separately.

```javascript
fastify.get('/admin', {
  preValidation: async (request, reply) => {
    if (!request.headers['x-admin-token']) {
      reply.code(401);
      throw new Error('Unauthorized');
    }
  }
}, async (request, reply) => {
  return { admin: true };
})
```


**Source files**

- [`docs/Reference/Routes.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Routes.md)
