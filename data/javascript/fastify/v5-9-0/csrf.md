# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: csrf

## csrf

### Prevent Cross-Site Request Forgery (CSRF) in Fastify Applications

**Use when**

Protecting session-authenticated and state-changing application endpoints (POST, PUT, PATCH, DELETE) against unauthorized actions initiated from untrusted origins.

**Secure rules**

**Rule 1: Fastify provides the maintained @fastify/csrf-protection plugin for adding CSRF protection.**

Fastify's ecosystem documentation lists `@fastify/csrf-protection` among the core plugins maintained by the Fastify team and describes it as a plugin for adding CSRF protection to Fastify.

**Rule 2: Read parsed request-body values only in preValidation or later lifecycle hooks.**

Fastify sets `request.body` to `undefined` during `onRequest` and `preParsing`; body parsing completes before `preValidation`, so read parsed body values only in `preValidation` or a later lifecycle phase. When an async hook sends a response to stop the request lifecycle, return the reply object.


**Source files**

- [`docs/Guides/Ecosystem.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Ecosystem.md)
- [`docs/Reference/Hooks.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Hooks.md)
