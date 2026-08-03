# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: network boundary

## network boundary

### Configure Explicit Host Bindings and Trusted Proxies

**Use when**

When deploying a Fastify application in containerized, serverless, or reverse-proxied network environments.

**Secure rules**

**Rule 1: Enable proxy trust configuration to safely handle client metadata through reverse proxies**

When hosting a Fastify server behind a managed reverse proxy or in serverless environments, initialize the framework with the `trustProxy` option. This ensures upstream proxy configurations are respected, allowing correct IP evaluation and client metadata parsing while preventing header-based IP spoofing.

```javascript
const Fastify = require('fastify');
const fastify = Fastify({ trustProxy: true });
```

**Rule 2: Select the `listen` host for the required interface reachability**

When no host is provided, Fastify listens on the addresses resolved by `localhost`. Setting the host to `0.0.0.0` listens on all IPv4 addresses; setting it to `::` listens on all IPv6 addresses and, depending on the operating system, may also listen on all IPv4 addresses. Be careful when listening on all interfaces because it carries inherent security risks. For a Kubernetes readiness probe that uses the pod IP, listen on `0.0.0.0` or configure a custom hostname in `readinessProbe.httpGet`.

```javascript
const fastify = require('fastify')();

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) throw err;
});
```


**Source files**

- [`lib/server.js`](https://github.com/fastify/fastify/blob/v5.9.0/lib/server.js)
- [`docs/Guides/Serverless.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Serverless.md)
