# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: deserialization

## deserialization

### Sanitize and validate untrusted JSON input before object merging

**Use when**

When parsing external JSON strings using `JSON.parse()` or similar methods before processing the resulting object.

**Secure rules**

**Rule 1: Do not ignore prototype-poisoning keys in JSON that may be merged.**

Fastify's default JSON parser rejects objects containing `__proto__` or `constructor` keys through the `onProtoPoisoning: 'error'` and `onConstructorPoisoning: 'error'` defaults. Keep these settings when untrusted request bodies may be copied or merged. Do not set `onProtoPoisoning` to `'ignore'`: it preserves the key, and copying the parsed object with `Object.assign()` can change the destination object's prototype.

```javascript
const fastify = require('fastify')({
  onProtoPoisoning: 'error',
  onConstructorPoisoning: 'error'
})

fastify.post('/objects', {
  schema: {
    body: {
      type: 'object',
      additionalProperties: false,
      required: ['name'],
      properties: {
        name: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  // Fastify has rejected prototype-poisoning keys before the handler runs
  return Object.assign({}, request.body, { id: generateId() });
});
```


**Source files**

- [`docs/Guides/Prototype-Poisoning.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Prototype-Poisoning.md)
