# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: runtime environment hardening

## runtime environment hardening

### Harden the Node.js Production Runtime Environment

**Use when**

When configuring the production deployment pipeline, container specifications, and package definitions for a Fastify application.

**Secure rules**

**Rule 1: Keep insecure HTTP parsing disabled.**

Run Node.js with `insecureHTTPParser: false`, the secure default assumed by Fastify. Deployments that enable `insecureHTTPParser: true` are outside Fastify's threat model.

```bash
node app.js
```

**Rule 2: Use a Node.js release supported by Fastify v5.**

Fastify v5 is tested and verified against Node.js release lines 20 and 22. Only the latest Node.js release of each supported line is supported.


**Source files**

- [`SECURITY.md`](https://github.com/fastify/fastify/blob/v5.9.0/SECURITY.md)
- [`docs/Reference/LTS.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/LTS.md)
