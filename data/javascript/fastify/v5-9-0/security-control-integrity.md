# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: security control integrity

## security control integrity

### Lock Down Compile-Time Configurations to Mitigate Runtime Bypass

**Use when**

When configuring and initializing validation, custom schema compilers, or routing rules during the server setup and bootstrap phases.

**Secure rules**

**Rule 1: Register validator and serializer compilers prior to calling the server's `listen` routine.**

Register custom compilers with `setValidatorCompiler` and `setSerializerCompiler` before calling `listen`. Once the server has started listening, Fastify rejects calls to either method.

**Rule 2: Register custom constraint strategies before server startup.**

Register custom constraint strategies with `addConstraintStrategy` before Fastify starts. Fastify rejects attempts to add a constraint strategy after the application has started.

**Rule 3: Clone or reconstruct schemas completely before mutating them for validation recompilation.**

Fastify caches compiled validation structures using the schema object's reference. Modifying a schema object in-place and submitting it again to `compileValidationSchema` or `validateInput` will result in the reuse of stale, cached validation logic. Always clone, duplicate, or programmatically recreate a schema when adding boundaries or strict validation parameters.

```javascript
const baseSchema = {
  type: 'object',
  properties: {
    token: { type: 'string' }
  }
};
const strictSchema = {
  ...baseSchema,
  properties: {
    ...baseSchema.properties,
    token: {
      type: 'string',
      maxLength: 32
    }
  }
};
const validator = request.compileValidationSchema(strictSchema);
```


**Source files**

- [`test/schema-feature.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/schema-feature.test.js)
- [`test/constrained-routes.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/constrained-routes.test.js)
- [`docs/Reference/Request.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Request.md)

### Manage Pipeline Hooks and Custom Validation Errors to Prevent Bypass

**Use when**

When implementing asynchronous request hooks, custom error handlers, or manual route-level validation rules in Fastify applications.

**Secure rules**

**Rule 1: Stop asynchronous hooks with a reply or an error.**

Replying from a hook stops the hook chain so the remaining hooks and handlers are not executed. In an `async` hook, call `reply.send()` before the function returns or its promise resolves, or throw an error. If `reply.send()` is called outside the promise chain, return `reply` to avoid executing the request twice. Do not mix callback and `async`/Promise styles.

```javascript
fastify.addHook('onRequest', async (request, reply) => {
  await reply.send('Early response');
});
```

**Rule 2: Handle validation errors when `attachValidation` is enabled.**

By default, Fastify automatically returns a 400 response when schema validation fails. With `attachValidation: true`, the validation `Error` and its raw result are available on `request.validationError`; handle that error in a `preHandler` hook or in the route handler.

```javascript
const schema = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' }
    },
    required: ['name']
  }
};

fastify.post('/', {
  attachValidation: true,
  schema,
  preHandler: (request, reply, done) => {
    if (request.validationError) {
      reply.code(400).send(request.validationError);
    } else {
      done();
    }
  }
}, (request, reply) => {
  reply.send(request.body);
});
```

**Rule 3: Throw `Error` instances from custom error handlers.**

Throwing a new error in a custom error handler calls the parent error handler. If a plugin's error handler rethrows a value that is not an `Error` instance, it does not propagate to the parent context error handler and is caught by Fastify's default error handler instead. Throw `Error` instances to ensure consistent error handling.

```javascript
fastify.setErrorHandler((error, request, reply) => {
  throw new Error('unauthorized');
});
```


**Source files**

- [`docs/Reference/Hooks.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Hooks.md)
- [`types/request.d.ts`](https://github.com/fastify/fastify/blob/v5.9.0/types/request.d.ts)
- [`docs/Reference/Errors.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Errors.md)
