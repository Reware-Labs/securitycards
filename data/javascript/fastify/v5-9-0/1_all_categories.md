# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`

## Category: access control

### Implement robust access control, routing constraints, and plugin encapsulation for Fastify routes

**Use when**

Developing and organizing route handlers, plugins, and custom request lifecycle hooks.

**Secure rules**

**Rule 1: Fail-fast authorization by gating protected routes within an `onRequest` hook.**

Use a scope-local hook to reject requests that lack necessary runtime keys or authentication tokens. Return a `503 Service Unavailable` status and include a `Retry-After` header to inform the client to attempt the request later.

```javascript
fastify.addHook('onRequest', function (request, reply, next) {
  if (!request.server.magicKey) {
    reply.statusCode = 503;
    reply.header('Retry-After', 5000);
    reply.send({ error: true });
    return;
  }
  next();
});
```

**Rule 2: Enforce strict route constraints for tenant or host separation.**

Explicitly define `constraints` on routes that require host-based or tenant-based filtering. Rejected requests will naturally return a `404 Not Found` rather than proceeding to unauthorized handlers.

```javascript
fastify.route({
  method: 'GET',
  url: '/secure',
  constraints: { host: 'trusted.example.com' },
  handler: (req, reply) => {
    reply.send({ data: 'secret' });
  }
});
```

**Rule 3: Require explicit opt-in for sensitive plugin behavior using route configuration.**

Utilize `routeOptions.config` to verify flags before applying potentially sensitive middleware or decorators within an `onRoute` hook. This prevents accidental application of plugins to unauthorized routes.

```javascript
instance.addHook('onRoute', (routeOptions) => {
  if (routeOptions.config?.useUtil === true) {
    // Safely attach plugin behavior here
  }
});
```

**Rule 4: Maintain strict plugin encapsulation to protect internal decorators.**

Keep authorization logic and helper decorators within the same encapsulation scope as the resources they protect. Avoid relying on global decorators to prevent accidental exposure of sensitive controls to unrelated plugins.

```javascript
fastify.register(async function privatePlugin (app) {
  app.decorate('requireAuth', async () => { /* auth logic */ });
  app.get('/private', async (req, reply) => {
    await app.requireAuth();
    return { success: true };
  });
});
```


**Source files**

- [`docs/Guides/Delay-Accepting-Requests.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Delay-Accepting-Requests.md)
- [`docs/Guides/Plugins-Guide.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Plugins-Guide.md)

## Category: api contract misuse

### Respect Request-Scoped State and Lifecycle Contracts

**Use when**

When registering request-scoped properties or managing HTTP response lifecycles in Fastify applications.

**Secure rules**

**Rule 1: Do not decorate Request or Reply instances with mutable reference types.**

Avoid calling `fastify.decorateRequest()` or `fastify.decorateReply()` with direct reference types like Arrays or Objects. In Fastify v5, this is prohibited because references are shared across all incoming requests, which can lead to critical race conditions and cross-request data leaks. To safely maintain request-scoped state context, initialize the state dynamically inside a lifecycle hook like `onRequest`.

```javascript
fastify.addHook('onRequest', async (request, reply) => {
  request.state = { sessionActive: false };
});
```

**Rule 2: Do not manually modify the read-only reply.sent property.**

Treat the `reply.sent` property as a read-only getter. Manually setting `reply.sent = true` is strictly forbidden by Fastify and throws a runtime exception, disrupting the core application control flow. To correctly advance or alter the HTTP lifecycle, use framework-authorized methods such as `reply.send()` or `reply.hijack()`.

```javascript
fastify.get('/data', (req, reply) => {
  // Correct: Let sending a payload transition the lifecycle state
  reply.send({ data: 'example' });
});
```


**Source files**

- [`docs/Guides/Migration-Guide-V5.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Migration-Guide-V5.md)
- [`test/internals/reply.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/internals/reply.test.js)

## Category: authentication

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

## Category: boundary control

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

## Category: configuration source integrity

### Treat Fastify Initial Configuration as Immutable

**Use when**

When instantiating and configuring a Fastify application instance with security-sensitive properties.

**Secure rules**

**Rule 1: Configure instance-wide security options through supported Fastify APIs and do not mutate fastify.initialConfig.**

Pass instance-wide options such as `bodyLimit` and `trustProxy` to the Fastify constructor. Fastify exposes `fastify.initialConfig` as a frozen, read-only copy of the initial configuration, and attempting to modify it throws a `TypeError`; do not use it to reconfigure a running instance. Use a setting's documented scoped configuration API when one is available.

```javascript
const fastify = require('fastify')({
  bodyLimit: 1048576,
  trustProxy: true
});
```

Note: `bodyLimit` may be configured per route as well


**Source files**

- [`lib/initial-config-validation.js`](https://github.com/fastify/fastify/blob/v5.9.0/lib/initial-config-validation.js)

## Category: cryptography

### Secure Webhooks and Transport Layer Security Configuration

**Use when**

Configuring inbound webhook endpoints and establishing secure HTTPS transport for server instances.

**Secure rules**

**Rule 1: Preserve original raw request bodies for cryptographic signature verification.**

When webhooks require signature validation, calculate the HMAC or digest against the raw, unparsed request bytes. Use a custom content-type parser to capture the raw payload before it is transformed into a standard JSON object to ensure accurate signature matching.

```javascript
fastify.addContentTypeParser('application/json', {}, (req, payload, done) => {
  req.rawBody = payload.rawBody;
  done(null, payload.body);
});
```

Only applicable for Firebase Functions.

**Rule 2: Prefer reverse-proxy TLS termination in production and use Fastify's https option for direct TLS.**

Prefer terminating production TLS at a reverse proxy, as recommended by Fastify. When the application must terminate TLS directly, pass the Node.js HTTPS server options, including the key and certificate, through Fastify's `https` constructor option.

```javascript
const fastify = Fastify({
  https: {
    key: fs.readFileSync('/etc/ssl/private/server.key'),
    cert: fs.readFileSync('/etc/ssl/certs/server.crt')
  }
});
await fastify.listen({ port: 443 });
```


**Source files**

- [`docs/Guides/Serverless.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Serverless.md)
- [`test/https/https.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/https/https.test.js)

## Category: csrf

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

## Category: dangerous execution

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

## Category: deserialization

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

## Category: escape hatch

### Restrict Use of Raw Response and Connection Hijack APIs

**Use when**

Developing Fastify route handlers or custom plugins that require low-level control over network responses or connection lifecycles.

**Secure rules**

**Rule 1: Avoid direct write operations via `reply.raw`**

Prefer Fastify's standard response APIs over the raw Node.js Response object (`reply.raw`). Using `reply.raw` to send a response skips Fastify's standard response logic, including serialization and automatic content-type handling. The `onResponse` hooks are still executed.

```javascript
fastify.get('/api/data', async (request, reply) => {
  reply.header('X-Response-Type', 'secure-json')
  return { secure: 'data' }
})
```

**Rule 2: Account for the lifecycle bypass caused by `reply.hijack()`**

Calling `reply.hijack()` before `reply.send()` halts the normal request lifecycle. It prevents Fastify from sending the response and from running the remaining hooks, and the application assumes full responsibility for the low-level request and response.

```javascript
fastify.get('/custom-stream', async (request, reply) => {
  reply.hijack()

  reply.raw.writeHead(200, {
    'Content-Type': 'text/plain',
    'Content-Security-Policy': "default-src 'self'"
  })
  reply.raw.write('safe payload')
  reply.raw.end()
})
```


**Source files**

- [`docs/Reference/Reply.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Reply.md)

## Category: file handling

### Secure Static File Serving in Fastify

**Use when**

When manually serving static files or assets, defining custom static routes, or bypassing the standard response lifecycle using hijack.

**Secure rules**

**Rule 1: Prefer static or simple parametric routes on hot paths.**

Prefer static or simple parametric routes on hot paths. Fastify supports regular expression routes, but they are expensive; routes with many parameters can also hurt router performance.

**Rule 2: Streams have no default content type; buffers default to `application/octet-stream`.**

When `reply.send()` sends a stream without a `Content-Type` header, the header remains unset. When it sends a buffer without a `Content-Type` header, Fastify sets `Content-Type` to `application/octet-stream`. `reply.type(contentType)` sets the response content type and is a shortcut for setting the `Content-Type` header.

**Rule 3: Handle the response manually after calling `reply.hijack()`.**

Calling `reply.hijack()` prevents Fastify from sending the response automatically and from running the remaining hooks. The application takes full responsibility for the low-level request and response. If `reply.raw` sends the response, `onResponse` hooks still run.

```javascript
fastify.get('/', (request, reply) => {
  reply.hijack()
  reply.raw.writeHead(200, { 'Content-Type': 'text/plain' })
  reply.raw.end('hijacked response')
})
```


**Source files**

- [`docs/Reference/Reply.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Reply.md)
- [`docs/Reference/Routes.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Routes.md)
- [`test/skip-reply-send.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/skip-reply-send.test.js)

## Category: injection

### Parameterized Database Queries to Prevent SQL Injection

**Use when**

When executing database queries using database integration plugins, such as `@fastify/mysql` or `@fastify/postgres`, within Fastify route handlers.

**Secure rules**

**Rule 1: Documented database queries use placeholders with parameter arrays**

Fastify's threat model classifies URL parameters as untrusted network input. The documented `@fastify/mysql` query uses a `?` placeholder with `[req.params.id]`, while the documented `@fastify/postgres` query uses `$1` with `[req.params.id]`.

```javascript
fastify.get('/user/:id', function(req, reply) {
  fastify.pg.query(
    'SELECT id, username, hash, salt FROM users WHERE id=$1',
    [req.params.id],
    function onResult (err, result) {
      reply.send(err || result)
    }
  )
})
```


**Source files**

- [`docs/Guides/Database.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Database.md)

## Category: input contract definition

### Define and Enforce Rigid Input Schemas in Fastify v5

**Use when**

Configuring validation schemas for request bodies, headers, query parameters, or route parameters in Fastify routes.

**Secure rules**

**Rule 1: Define full JSON schemas for querystring, params, and body schemas.**

Starting with Fastify v5, provide full JSON schemas for `querystring`, `params`, and `body` schemas. When using the default JSON Schema validator, include the `type` property; the `jsonShortHand` option has been removed.

```javascript
fastify.get('/route', {
  schema: {
    querystring: {
      type: 'object',
      properties: {
        name: { type: 'string' }
      },
      required: ['name']
    }
  }
}, (request, reply) => {
  reply.send({ hello: request.query.name })
})
```

**Rule 2: Define a TypeBox schema and derive its corresponding TypeScript type.**

For payload validation with TypeBox, define the schema with `Type`, create its corresponding type with `Static`, and use both the schema and type in the route definition.

```typescript
import { Static, Type } from 'typebox'
import Fastify from 'fastify'

const User = Type.Object({
  name: Type.String(),
  mail: Type.Optional(Type.String({ format: 'email' }))
})

type UserType = Static<typeof User>

const fastify = Fastify()

fastify.post<{ Body: UserType, Reply: UserType }>(
  '/',
  {
    schema: {
      body: User,
      response: {
        200: User
      }
    }
  },
  (request, reply) => {
    const { name, mail } = request.body
    reply.status(200).send({ name, mail })
  }
)
```

**Rule 3: Equip all accepted media types with an explicit schema when using split content validation.**

Defining validation on explicit media types using `schema.body.content` causes Fastify to silently skip validation for incoming content types not explicitly listed in that configuration map. Define validation rules for every single parsed content type.

```javascript
fastify.post('/submit', {
  schema: {
    body: {
      content: {
        'application/json': {
          schema: jsonSchema
        },
        'text/plain': {
          schema: {
            type: 'string',
            maxLength: 1000
          }
        }
      }
    }
  }
}, async (req, reply) => {
  return { success: true }
})
```

**Rule 4: Custom header schemas are compiled without automatic key lowercasing.**

For plain-object header schemas, Fastify lowercases entries in `required` and keys in `properties` before compiling the schema. When a custom validator is used or the header schema is not a plain object, Fastify compiles the supplied header schema without modifying it.


**Source files**

- [`docs/Guides/Migration-Guide-V5.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Migration-Guide-V5.md)
- [`docs/Reference/TypeScript.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/TypeScript.md)
- [`test/schema-validation.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/schema-validation.test.js)
- [`test/internals/validation.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/internals/validation.test.js)
- [`docs/Guides/Fluent-Schema.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Fluent-Schema.md)

## Category: input driven boundary selection

### Fail Secure During Async Route Constraint Derivation

**Use when**

Implementing custom asynchronous route constraints to isolate tenant or resource boundaries based on incoming request headers.

**Secure rules**

**Rule 1: Propagate all errors to the callback during custom constraint derivation to prevent fallback route matching.**

When writing an asynchronous `deriveConstraint` function for a custom route strategy (such as tenant boundary selection), ensure any lookup, validation, or system error is immediately passed to the `done` callback as the first argument. This halts request routing and prevents fallback matching to unintended or unconstrained route handlers.

```javascript
const constraint = {
  name: 'tenant',
  storage: () => { /* ... */ },
  deriveConstraint: (req, ctx, done) => {
    getTenantDetails(req.headers['x-tenant-id'], (err, tenant) => {
      if (err) {
        return done(err); // Safely aborts request with a 500 error
      }
      done(null, tenant);
    });
  },
  validate: () => true
};
```


**Source files**

- [`test/constrained-routes.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/constrained-routes.test.js)

## Category: input interpretation safety

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

## Category: interface protocol hardening

### Harden HTTP Protocol Integrity and Request Trust

**Use when**

Configuring Fastify routing, response trailers, and trusted proxy settings to prevent HTTP request smuggling and protocol spoofing.

**Secure rules**

**Rule 1: Do not register invalid response trailer names with `reply.trailer()`**

Fastify throws an error when `reply.trailer()` is called with an invalid trailer name, including `set-cookie`, `authorization`, `transfer-encoding`, `content-length`, `host`, or `trailer`. Documented response trailer examples include `Server-Timing`, `ETag`, and `content-md5`.

```javascript
const { createHash } = require('node:crypto')

fastify.get('/checksum', (request, reply) => {
  reply.trailer('content-md5', (reply, payload, done) => {
    const hash = createHash('md5').update(payload).digest('hex')
    done(null, hash)
  })
  reply.send('someData')
})
```

**Rule 2: Configure `trustProxy` strictly to trusted reverse proxy IP addresses to prevent protocol spoofing**

Avoid enabling global proxy trust. Configure `trustProxy` to exclusively target trusted address spaces (such as the specific loopback address `127.0.0.1` or the explicit IP of an upstream proxy). Keeping this strictly configured prevents external attackers from injecting fake security protocol headers like `X-Forwarded-Proto`, which could fool the server into treating unencrypted requests as secure HTTPS contexts.

```javascript
const Fastify = require('fastify')

const fastify = Fastify({
  trustProxy: '127.0.0.1',
  https: {
    key: process.env.SSL_KEY,
    cert: process.env.SSL_CERT
  }
})

fastify.get('/status', (req, reply) => {
  reply.send({ safe: req.protocol === 'https' })
})
```


**Source files**

- [`test/reply-trailers.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/reply-trailers.test.js)
- [`test/https/https.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/https/https.test.js)
- [`docs/Guides/Recommendations.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Recommendations.md)

## Category: network boundary

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

## Category: output encoding

### Encode dynamic inputs in headers and redirect targets

**Use when**

When setting dynamic response headers or executing redirects with untrusted parameters.

**Secure rules**

**Rule 1: Encode destination URLs passed to redirect functions**

Input URLs passed to `reply.redirect()` must be properly encoded using `encodeURI` or a similar module such as `encodeurl`. Invalid URLs result in a `500 TypeError` response.

```javascript
fastify.get('/redirect', (request, reply) => {
  reply.redirect(encodeURI('/?key=a’b'))
})
```

**Rule 2: Properly encode values passed to `reply.header()`**

Header values passed to `reply.header()` must be properly encoded using `encodeURI` or a similar module such as `encodeurl`. Invalid characters result in a handled `500 TypeError` response rather than crashing the server.

```javascript
const encodeurl = require('encodeurl')

fastify.get('/custom-header', (request, reply) => {
  const rawInput = request.query.customValue
  const safeInput = encodeurl(rawInput)
  reply.header('X-Custom-Data', safeInput)
  reply.send({ status: 'success' })
})
```


**Source files**

- [`docs/Reference/Reply.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Reply.md)

## Category: resource exhaustion

### Bypass CPU and Payload Overhead in Parsers, Validations, and Hooks

**Use when**

When registering custom serializers, writing hooks, or implementing validation definitions.

**Secure rules**

**Rule 1: Enforce limits on custom content-type parsers and streams**

When registering new content decoders, pass explicit limits to prevent excessive allocation in buffers using options such as `bodyLimit`. For custom `preParsing` hooks handling raw data streams, maintain and update the `receivedEncodedLength` property dynamically to preserve Fastify's framework-level payload auditing.

```javascript
fastify.addContentTypeParser(
  'application/custom-json',
  { parseAs: 'string', bodyLimit: 1048576 },
  function (req, body, done) {
    try {
      const parsed = JSON.parse(body);
      done(null, parsed);
    } catch (err) {
      err.statusCode = 400;
      done(err, undefined);
    }
  }
);

fastify.addHook('preParsing', async (request, reply, payload) => {
  const customStream = someDecompressionTransform(payload);
  customStream.receivedEncodedLength = 0;
  payload.on('data', (chunk) => {
    customStream.receivedEncodedLength += chunk.length;
  });
  return customStream;
});
```

**Rule 2: Disable Ajv all-errors reporting and defer asynchronous tasks**

Explicitly set Ajv `allErrors` to `false`; when set to `true`, a denial-of-service attack is possible. Do not use Ajv's `$async` feature for initial validation or access databases during validation. Use a hook such as `preHandler` for asynchronous tasks after validation.

```javascript
const fastify = require('fastify')({
  ajv: {
    customOptions: {
      allErrors: false
    }
  }
});

fastify.post('/register', {
  schema: {
    body: {
      type: 'object',
      properties: { username: { type: 'string' } },
      required: ['username']
    }
  },
  preHandler: async (request, reply) => {
    const existingUser = await db.findUser(request.body.username);
    if (existingUser) {
      reply.code(400).send({ error: 'Username already in use' });
    }
  }
}, handler);
```

**Rule 3: Unsafe route regular expressions are disabled by default**

Regular expression routes are supported, but they are expensive in terms of performance. `routerOptions.allowUnsafeRegex` defaults to `false`, so routes allow only safe regular expressions. Setting it to `true` permits unsafe expressions.


**Source files**

- [`docs/Guides/Recommendations.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Recommendations.md)
- [`docs/Reference/Validation-and-Serialization.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Validation-and-Serialization.md)
- [`docs/Reference/ContentTypeParser.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/ContentTypeParser.md)
- [`docs/Reference/Hooks.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Hooks.md)
- [`docs/Reference/Routes.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Routes.md)

### Configure Global Server Limits and Connection Timeouts

**Use when**

When initializing a Fastify server instance to safely handle public-facing network requests.

**Secure rules**

**Rule 1: Configure request payload and dynamic path parameter limits**

Set `bodyLimit` during initialization to define the maximum payload, in bytes, that the server accepts; a request body that exceeds the limit receives a 413 response. Set `routerOptions.maxParamLength` to define a custom maximum length for parameters in parametric routes; a parameter that exceeds the configured length receives a 414 response.

```javascript
const fastify = require('fastify')({
  bodyLimit: 524288,
  routerOptions: {
    maxParamLength: 32
  }
});
```

**Rule 2: Configure HTTP/1 server timeouts and requests per socket**

Fastify accepts `connectionTimeout`, `keepAliveTimeout`, `requestTimeout`, and `maxRequestsPerSocket` as server initialization options. For HTTP/1, Fastify assigns `keepAliveTimeout` and `requestTimeout` to the server, passes `connectionTimeout` to `server.setTimeout()`, and assigns `maxRequestsPerSocket` when its value is greater than zero.

```javascript
const fastify = require('fastify')({
  connectionTimeout: 10000,
  keepAliveTimeout: 5000,
  requestTimeout: 15000,
  maxRequestsPerSocket: 100
});
```

**Rule 3: Use Fastify's HTTP/2 session timeout**

Fastify sets `http2SessionTimeout` to `72000` milliseconds by default. It applies this timeout to every incoming HTTP/2 session and closes the session when the timeout fires; the low default is chosen to mitigate denial-of-service attacks. When the server is behind a load balancer or can scale automatically, the value can be increased to fit the use case.

```javascript
const fastify = require('fastify')({
  http2: true
});
```

**Rule 4: Release active database connection pooling upon instance termination**

In order to prevent structural socket leaks and database connection exhaustion, utilize connection-close settings within official database plugins, or register an explicit `onClose` hook to gracefully close database sockets when the Fastify instance shuts down.

```javascript
fastify.register(require('@fastify/redis'), {
  client: redis,
  closeClient: true
});

fastify.addHook('onClose', (fastify, done) => {
  connection.end().then(done).catch(done);
});
```


**Source files**

- [`docs/Reference/Server.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Server.md)
- [`test/router-options.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/router-options.test.js)
- [`test/http2/closing.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/http2/closing.test.js)
- [`lib/server.js`](https://github.com/fastify/fastify/blob/v5.9.0/lib/server.js)
- [`test/types/fastify.tst.ts`](https://github.com/fastify/fastify/blob/v5.9.0/test/types/fastify.tst.ts)
- [`docs/Guides/Database.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Database.md)

## Category: runtime environment hardening

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

## Category: secret handling

### Protect Secrets and TLS Credentials from Exposure

**Use when**

When managing TLS key material, certificates, and runtime credentials in Fastify.

**Secure rules**

**Rule 1: Do not expect TLS keys or certificates in the Fastify initial configuration**

`fastify.initialConfig` is a frozen, read-only object. When HTTPS is initialized with `key`, `cert`, and `allowHTTP1: true`, `fastify.initialConfig.https` contains only `{ allowHTTP1: true }`; the key and certificate are removed.

```javascript
const { readFileSync } = require('node:fs');
const Fastify = require('fastify');

const fastify = Fastify({
  https: {
    allowHTTP1: true,
    key: readFileSync('./fastify.key'),
    cert: readFileSync('./fastify.cert')
  }
});

console.log(fastify.initialConfig.https);
```

**Rule 2: Do not treat decorator-based local authentication state as production-ready**

Fastify's delay-accepting-requests guide stores a provider-supplied `magicKey` in a decorator, but identifies that implementation as not production-ready and not horizontally scalable. Storing the `magicKey` elsewhere, such as in a cache database, is one possible improvement.


**Source files**

- [`docs/Guides/Delay-Accepting-Requests.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Delay-Accepting-Requests.md)
- [`test/internals/initial-config.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/internals/initial-config.test.js)

## Category: security control integrity

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

## Category: session management

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
