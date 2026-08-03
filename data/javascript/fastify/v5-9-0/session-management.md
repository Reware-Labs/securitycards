# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: session management

## session management

### Configure Secure Session and Connection Lifecycle Policies

**Use when**

When initializing a Fastify server that handles user sessions and requires stable infrastructure resource management.

**Secure rules**

**Rule 1: Create secure stateless cookie sessions with `@fastify/secure-session`**

Fastify's ecosystem guide lists `@fastify/secure-session` as the plugin for creating a secure stateless cookie session for Fastify.

**Rule 2: Configure server timeouts and request limits**

Fastify accepts `connectionTimeout`, `requestTimeout`, `keepAliveTimeout`, `maxRequestsPerSocket`, and `http2SessionTimeout` as initialization options. Their defaults are `0`, `0`, `72000`, `0`, and `72000` respectively; zero represents no timeout or no limit for the applicable option.


**Source files**

- [`docs/Guides/Ecosystem.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Ecosystem.md)
- [`lib/server.js`](https://github.com/fastify/fastify/blob/v5.9.0/lib/server.js)
