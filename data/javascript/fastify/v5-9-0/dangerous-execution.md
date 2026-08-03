# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: dangerous execution

## dangerous execution

### Define Fastify Schemas Statically to Prevent Server-Side Code Execution

**Use when**

When defining input validation and serialization schemas for Fastify routes, including querystrings, parameters, request bodies, and responses.

**Secure rules**

**Rule 1: Avoid compiling schemas constructed from untrusted user input**

Do not dynamically construct or build schemas using user-controlled parameters. Because Fastify's underlying validation (Ajv) and serialization (fast-json-stringify) engines compile these definitions into executable JavaScript code using the `new Function()` constructor, dynamically building schemas with untrusted input can lead to arbitrary server-side code execution. Always define route, query, parameter, and response schemas as static, hardcoded structures within your application code.

```javascript
const bodySchema = {
  type: 'object',
  properties: {
    username: { type: 'string' }
  },
  required: ['username']
};

fastify.post('/register', { schema: { body: bodySchema } }, handler);
```


**Source files**

- [`docs/Reference/Validation-and-Serialization.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Validation-and-Serialization.md)
