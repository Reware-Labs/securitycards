# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: boundary control

## boundary control

### Isolate Security Controls via Encapsulation Contexts

**Use when**

Structuring routes that require different security policies, such as authentication, within a Fastify application.

**Secure rules**

**Rule 1: Isolate routes requiring specific security policies inside distinct encapsulated plugin contexts.**

Use `fastify.register` to establish distinct child contexts for routes. When a security mechanism (such as authentication or rate-limiting) is registered inside a plugin context, Fastify's encapsulation ensures that the security hooks only apply to the routes within that context boundary. This prevents sensitive paths from accidentally bypassing security checks or leaking security mechanisms to public routes.

```javascript
fastify.register(async function authenticatedContext (childServer) {
  childServer.register(require('@fastify/bearer-auth'), { keys: ['secure-token'] })
  childServer.route({
    path: '/secure-data',
    method: 'GET',
    handler (request, reply) {
      reply.send({ sensitive: 'data' })
    }
  })
})

fastify.register(async function publicContext (childServer) {
  childServer.route({
    path: '/public-data',
    method: 'GET',
    handler (request, reply) {
      reply.send({ sensitive: 'none' })
    }
  })
}
```


**Source files**

- [`docs/Reference/Encapsulation.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Encapsulation.md)
