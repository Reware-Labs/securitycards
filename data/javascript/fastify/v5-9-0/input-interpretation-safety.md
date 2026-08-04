# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: input interpretation safety

## input interpretation safety

### Configure and Handle Parsed Payloads safely to Prevent Prototype Poisoning

**Use when**

Configuring Fastify instances and processing early request payloads or parameter inputs.

**Secure rules**

**Rule 1: Know the defaults and supported prototype poisoning parsing actions.**

Fastify uses `onProtoPoisoning` when parsing a JSON object with `__proto__` and `onConstructorPoisoning` when parsing a JSON object with `constructor`. Both options default to `'error'` and support `'error'`, `'remove'`, and `'ignore'`; `'ignore'` skips validation.

**Rule 2: Recognize that `Object.assign` can turn a parsed `__proto__` property into a prototype.**

`JSON.parse()` treats `__proto__` in JSON text as an ordinary property. Passing the parsed object to `Object.assign({}, parsed)` for a shallow copy can make that property the destination object's actual prototype; inherited properties may then be missed by validation that examines only the object's own properties.

**Rule 3: Query route parameters safely without assuming prototype existence.**

In Fastify v5, `request.params` no longer has a prototype. When reading parameters, do not call inherited methods like `hasOwnProperty` directly on `request.params`. Instead, use `Object.hasOwn(request.params, ...)`.

```javascript
fastify.get('/route/:name', (request, reply) => {
  console.log(Object.hasOwn(request.params, 'name')); // true
  return { hello: request.params.name };
});
```


**Source files**

- [`docs/Reference/Server.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Server.md)
- [`docs/Guides/Prototype-Poisoning.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Prototype-Poisoning.md)
- [`docs/Guides/Migration-Guide-V5.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Migration-Guide-V5.md)

### Use Coerced and Sanitized Request Objects to Prevent Type Evasion

**Use when**

Accessing request parameters, bodies, headers, or query fields in route handlers and validation hooks.

**Secure rules**

**Rule 1: Configure route schemas and cover accepted body content types.**

To validate request input, add schemas for `body`, `querystring` or `query`, `params`, and `headers` to the route schema. When a body schema uses a `content` map, validation is applied according to the request's `Content-Type`; with a custom content type parser, ensure that every accepted content type has a corresponding key in the map, or use a body schema without `content`.

```javascript
fastify.post('/create', {
  schema: {
    body: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'integer' } }
    }
  }
}, async (request, reply) => {
  const validatedId = request.body.id;
  return { success: true, id: validatedId };
});
```

**Rule 2: Change request payloads in `preValidation` before validation.**

The `preValidation` hook can change the parsed request payload before it is validated.

```javascript
fastify.addHook('preValidation', (request, reply, done) => {
  request.body = { ...request.body, importantKey: 'randomString' };
  done();
});
```

**Rule 3: Prefer explicit nullable configurations over anyOf null branches when utilizing validation type coercion.**

When performing type coercion on schema parameters, do not specify an `anyOf` schema with a null branch. Such definitions can trigger premature coercion of values like `0` or `false` into `null`. Use `nullable: true` or standard type array definitions to allow null inputs cleanly.

```javascript
const correctSchema = {
  type: 'object',
  properties: {
    score: {
      type: 'number',
      nullable: true
    }
  }
};
```


**Source files**

- [`lib/validation.js`](https://github.com/fastify/fastify/blob/v5.9.0/lib/validation.js)
- [`lib/handle-request.js`](https://github.com/fastify/fastify/blob/v5.9.0/lib/handle-request.js)
- [`docs/Reference/Validation-and-Serialization.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Validation-and-Serialization.md)
