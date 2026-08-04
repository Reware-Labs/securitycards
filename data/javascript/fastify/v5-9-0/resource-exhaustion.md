# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: resource exhaustion

## resource exhaustion

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
