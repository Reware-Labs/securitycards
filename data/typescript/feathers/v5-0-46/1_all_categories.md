# Security cards

Repository: `https://github.com/feathersjs/feathers#v5.0.46`

## Category: access control

### Configure Platform Permissions and Authorization Controls

**Use when**

When managing user permissions, capabilities, roles, and administrative update boundaries across Feathers services and authentication flows.

**Secure rules**

**Rule 1: Embed user permissions into JWT payloads via getPayload**

Override `AuthenticationService.getPayload` to bind user authorization claims into the signed JWT payload. Always call `super.getPayload(authResult, params)` first to maintain standard token claims before appending permissions.

```ts
import type { Params } from '@feathersjs/feathers'
import type { AuthenticationResult } from '@feathersjs/authentication'
import { AuthenticationService } from '@feathersjs/authentication'

class CustomAuthService extends AuthenticationService {
  async getPayload(authResult: AuthenticationResult, params: Params) {
    const payload = await super.getPayload(authResult, params)
    const { user } = authResult

    if (user && user.permissions) {
      payload.permissions = user.permissions
    }

    return payload
  }
}

app.use('/authentication', new CustomAuthService(app))
```

**Rule 2: Restrict real-time events to authenticated channels**

Create dedicated channels and publish events exclusively to channels that contain authenticated (and, if needed, further authorized) connections. On every new socket connection, join it to a low-privilege `anonymous` channel; after successful authentication, move the connection to `authenticated` (or a role-specific channel) and publish events only to that channel.

```ts
// channels.ts
import type { RealTimeConnection, Params } from '@feathersjs/feathers'
import type { AuthenticationResult } from '@feathersjs/authentication'

app.on('connection', (connection: RealTimeConnection) => {
  // All new sockets start as anonymous
  app.channel('anonymous').join(connection)
})

app.on('login', (payload: AuthenticationResult, { connection }: Params) => {
  if (connection) {
    // Upgrade the socket: leave anonymous, join authenticated
    app.channel('anonymous').leave(connection)
    app.channel('authenticated').join(connection)
  }
})

// Publish every service event only to authenticated users
app.publish((_data, _context) => app.channel('authenticated'))
```

**Rule 3: Keep stateless JWTs short-lived when embedding permissions**

If you configure the `JWT` strategy with `"entity": null`, the token becomes *stateless*: all data (including user permissions) is baked into the payload and **cannot be revoked or updated** before the token expires. Mitigate this risk by issuing tokens with a deliberately short `expiresIn` setting.

```js
// authentication configuration (e.g. config/default.json)
{
  "authentication": {
    "secret": "CHANGE_ME",
    "entity": null,              // make JWT stateless
    "authStrategies": ["jwt"],
    "jwtOptions": {
      "expiresIn": "15m"         // short-lived token limits stale permissions
    }
  }
}

const { AuthenticationService } = require('@feathersjs/authentication')

class MyAuthService extends AuthenticationService {
  // Embed current permissions into the stateless token
  async getPayload (authResult, params) {
    const payload = await super.getPayload(authResult, params)
    const { user } = authResult
    if (user?.permissions) payload.permissions = user.permissions
    return payload
  }
}

app.use('/authentication', new MyAuthService(app))
```


### Enforce User Data Isolation and Access Controls in Feathers Services and Resolvers

**Use when**

Use when implementing access control restrictions, tenant isolation, and role checks within Feathers service hooks and query resolvers to prevent unauthorized cross-user data access and mutations.

**Secure rules**

**Rule 1: Enforce explicit role checks and authentication state inside service hooks**

Verify that `context.params.user` is present and has the required permissions or roles before allowing service execution to prevent unauthorized database access.

```typescript
app.service('messages').hooks({
  before: {
    all: [
      async (context) => {
        if (!context.params.user) {
          throw new Error('Unauthenticated');
        }
      }
    ]
  }
});
```


### Restrict External Service Calls and Query Filters Using Provider and Schema Resolvers

**Use when**

Use when securing service endpoints against external transport exposure and binding query filters to authenticated user or tenant ownership constraints.

**Secure rules**

**Rule 1: Restrict internal service methods from external transport invocation using provider context checks**

Check `context.params.provider` inside service hooks to block unauthorized external callers from invoking administrative or internal-only methods via REST.

```typescript
import { HookContext } from '@feathersjs/feathers'

app.service('users').hooks({
  before: {
    remove: [
      async (context: HookContext) => {
        if (context.params.provider === 'rest') {
          throw new Error('User deletion is not allowed via REST')
        }
      }
    ]
  }
})
```

**Rule 2: Enforce user and tenant scoping in query resolvers using schema hooks**

Use `schemaHooks.resolveQuery` to bind incoming request query filters directly to `context.params.user` to prevent unauthorized access across tenants.

```typescript
import { hooks as schemaHooks, resolve } from '@feathersjs/schema'

export const companyFilterQueryResolver = resolve<Company, HookContext>({
  ownerUser: (value, obj, context) => {
    if (context.params.user) {
      return context.params.user.id
    }
    return value
  }
})

app.service('companies').hooks({
  before: {
    all: [schemaHooks.resolveQuery(companyFilterQueryResolver)]
  }
})
```


## Category: api contract misuse

### Safely Access Internal Knex Errors Server-Side

**Use when**

Handling and logging database exceptions thrown by the `@feathersjs/knex` adapter without leaking sensitive database details to clients.

**Secure rules**

**Rule 1: Retrieve the raw database error via the exported `ERROR` symbol for server-side logging while returning sanitized Feathers errors to remote clients.**

The `@feathersjs/knex` adapter automatically converts database exceptions into generic Feathers errors to prevent leaking database layout and SQL error details. When debugging or logging server-side errors, retrieve the raw database error using the exported `ERROR` symbol without re-exposing raw error properties to remote clients.

```typescript
import { ERROR } from '@feathersjs/knex'

try {
  await knexService.create(data)
} catch (error: any) {
  const rawKnexError = error[ERROR]
  logger.error('Database operation failed', { rawKnexError })
  throw error
}
```


## Category: authentication

### Enforce authentication and strategy registration using authentication hooks and services

**Use when**

When establishing identity verification, registering authentication strategies, and protecting service or route endpoints in a Feathers application.

**Secure rules**

**Rule 1: Use the authenticate hook or explicit service authentication to verify credentials and prevent unauthenticated access.**

Attach the `authenticate` hook on service methods or invoke `authService.authenticate()` explicitly to ensure requests carry validated credentials rather than unverified tokens.

```ts
import { hooks as authHooks } from '@feathersjs/authentication'

app.service('protected-service').hooks({
  before: {
    all: [authHooks.authenticate('jwt')]
  }
})
```

**Rule 2: Register required authentication strategies on the AuthenticationService instance.**

Register necessary strategies such as `jwt` and `local` on the `AuthenticationService` and mount it to handle authentication flows properly.

```ts
import { AuthenticationService, JWTStrategy } from '@feathersjs/authentication'
import { LocalStrategy } from '@feathersjs/authentication-local'
import type { Application } from './declarations'

declare module './declarations' {
  interface ServiceTypes {
    authentication: AuthenticationService
  }
}

export const authentication = (app: Application) => {
  const authentication = new AuthenticationService(app)

  authentication.register('jwt', new JWTStrategy())
  authentication.register('local', new LocalStrategy())

  app.use('authentication', authentication)
}
```

**Rule 3: Throw NotAuthenticated error on custom strategy authentication failures.**

Ensure custom authentication strategies throw a `NotAuthenticated` error instead of returning falsy values when token validation fails.

```ts
import { AuthenticationBaseStrategy } from '@feathersjs/authentication'
import { NotAuthenticated } from '@feathersjs/errors'

export class CustomStrategy extends AuthenticationBaseStrategy {
  async authenticate(authentication: any, params: any) {
    const { secretToken } = authentication
    const isValid = await this.validateToken(secretToken)

    if (!isValid) {
      throw new NotAuthenticated('Invalid authentication token')
    }

    return {
      authenticated: true,
      user: { id: 123 }
    }
  }
}
```


## Category: boundary control

### Enforce Boundary Checks and Sanitize External Input at the Server Interface

**Use when**

Handling incoming requests from untrusted clients, extracting parameters from query contexts, or distinguishing external transport requests from internal service calls.

**Secure rules**

**Rule 1: Validate and sanitize custom client parameters extracted from the query context before assigning them to server context properties.**

When extracting custom client parameters from `params.query` on the server, developers must explicitly sanitize and validate all client-supplied values to prevent authorization bypasses or context manipulation.

```typescript
app.hooks({
  before: {
    all: [
      async (context: HookContext) => {
        const { $client = {}, ...query } = context.params.query || {}
        const platform = typeof $client.platform === 'string' ? $client.platform : 'unknown'
        context.params = {
          ...context.params,
          platform,
          query
        }
      }
    ]
  }
})
```

**Rule 2: Distinguish external transport requests from internal service calls using context parameters.**

Use `context.params.provider` to check if a request originated externally via REST or Socket.io and enforce authentication and boundary checks accordingly.

```typescript
export const enforceExternalCheck = async (context: HookContext) => {
  if (context.params.provider) {
    if (!context.params.user) {
      throw new Error('Unauthenticated external request')
    }
  }
}
```

**Rule 3: Prevent untrusted clients from directly passing internal database flags or aggregation parameters.**

Construct sensitive parameters such as `params.pipeline` and `params.mongodb` server-side inside hooks or service methods based on authenticated context, rather than accepting them directly from client requests.

```typescript
export const restrictUserPages = async (context: HookContext) => {
  context.params.pipeline = [
    { $match: { userId: context.params.user._id } }
  ]
}
```


## Category: configuration source integrity

### Map Environment Variables Explicitly Using Node-Config Mappings

**Use when**

Configuring application settings and environment variables in Feathers v5 applications where implicit automatic environment variable substitution is no longer supported by `@feathersjs/configuration`.

**Secure rules**

**Rule 1: Explicitly map environment variables using node-config mappings to ensure trusted and unambiguous configuration sources.**

Define configuration mappings explicitly using `config/custom-environment-variables.json` or the `NODE_CONFIG` environment variable to prevent applications from silently falling back to unencrypted or default values.

```json
{
  "port": "PORT",
  "authentication": {
    "secret": "AUTH_SECRET"
  }
}
```


## Category: cryptography

### Hash user passwords securely before database persistence

**Use when**

When defining data resolvers to prepare user credentials before saving them to the database in a Feathers application.

**Secure rules**

**Rule 1: Use the passwordHash property resolver utility for one-way password hashing.**

Always hash plain text passwords using the `passwordHash` property resolver utility from `@feathersjs/authentication-local` within data resolvers to safely perform one-way Bcrypt hashing before saving passwords to the database.

```typescript
import { resolve } from '@feathersjs/schema'
import { passwordHash } from '@feathersjs/authentication-local'

export const userDataResolver = resolve<User, HookContext>({
  properties: {
    password: passwordHash({ strategy: 'local' })
  }
})
```


## Category: csrf

### Configure Client Token Storage to Avoid CSRF

**Use when**

Configuring authentication client token storage in Feathers applications.

**Secure rules**

**Rule 1: Maintain default LocalStorage token persistence for client JWTs unless robust anti-CSRF mechanisms are implemented when switching to cookie storage.**

Feathers stores JWTs in browser `LocalStorage` by default to avoid Cross-Site Request Forgery. If authentication is configured to store JWTs in cookies instead, browser requests become susceptible to CSRF attacks, so you must keep client token storage in `LocalStorage` unless using proper CSRF protection like `SameSite` cookie flags and CSRF tokens.

```javascript
const client = feathers();
client.configure(feathers.authentication({
  storage: window.localStorage
}));
```


## Category: deserialization

### Enforce Schema Type Coercion and Validation for REST Query Deserialization

**Use when**

When processing incoming requests over HTTP REST transports where query parameters are deserialized strictly as strings.

**Secure rules**

**Rule 1: Validate and coerce query parameters with `schemaHooks.validateQuery`**

Always run incoming query parameters through a schema-based validator that has **type-coercion enabled**.
Use a TypeBox schema, compile it with `getValidator` and the `queryValidator` (configured with `coerceTypes: true`), and register the resulting function via `schemaHooks.validateQuery` in a `before` or `around` hook. This guarantees that strings like `"true"` or `"42"` are converted to booleans or numbers before they reach your database adapter.

```ts
import { schemaHooks } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { queryValidator } from '../validators'

//  Define the allowed query properties
const todoQueryProps = Type.Object({
  status: Type.Optional(Type.String()),
  completed: Type.Optional(Type.Boolean())
}, { additionalProperties: false })

// Add Feathers query operators ($limit, $sort, …)
const todoQuerySchema = querySyntax(todoQueryProps)

// Compile the validator (coercion is enabled in queryValidator)
const todoQueryValidator = getValidator(todoQuerySchema, queryValidator)

// Enforce it in a hook
app.service('todos').hooks({
  around: {
    all: [schemaHooks.validateQuery(todoQueryValidator)]
  }
})
```


## Category: file handling

### Validate uploaded files in Feathers service hooks

**Use when**

Handling file uploads through Express middleware and Feathers services where uploaded file attributes must be validated.

**Secure rules**

**Rule 1: Validate uploaded file attributes and MIME types inside service hooks before processing storage operations.**

Map incoming files to `context.params.file` using Express middleware and implement a `before` hook on the uploads service to verify file properties such as `mimetype` against an explicit allowlist.

```typescript
app.use('/uploads',
  multipartMiddleware.single('uri'),
  (req, res, next) => {
    req.feathers.file = req.file;
    next();
  },
  blobService({ Model: blobStorage })
);

app.service('uploads').hooks({
  before: {
    create: [
      async (context) => {
        const file = context.params.file;
        if (!file || !['image/png', 'image/jpeg'].includes(file.mimetype)) {
          throw new Error('Invalid file type');
        }
      }
    ]
  }
});
```


## Category: injection

### Configure disabled operators to prevent untrusted query parameter manipulation in MongoDB services

**Use when**

When initializing MongoDB services in Feathers to restrict query update operators and prevent unauthorized field modification.

**Secure rules**

**Rule 1: Explicitly configure disabled operators on the MongoDB service to block unwanted update operators.**

Prevent untrusted query operators from altering document fields by setting `disabledOperators` during the initialization of the `MongoDBService` class.

```ts
new MongoDBService({
  Model: app.get('mongodbClient').then((db) => db.collection('users')),
  disabledOperators: ['$rename', '$unset', '$inc']
})
```


## Category: input contract definition

### Validate Request Payloads and Query Parameters with Strict Schemas

**Use when**

Defining and validating incoming service data and query parameters using schema hooks to reject malformed input and unexpected properties.

**Secure rules**

**Rule 1: Enforce strict schema validation for both data and query**

Define TypeBox / JSON-Schema definitions with `additionalProperties: false` to forbid extra fields, compile them into validator functions, and apply **both** `schemaHooks.validateData` **and** `schemaHooks.validateQuery` so that malformed payloads or query parameters are rejected before service logic runs.

```ts
import { hooks as schemaHooks } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { dataValidator, queryValidator } from '../validators'

// ─── Data schema ───────────────────────────────────────────────────────────────
const userDataSchema = Type.Object(
  {
    email:    Type.String({ format: 'email' }),
    password: Type.String({ minLength: 8 })
  },
  { $id: 'UserData', additionalProperties: false } // unknown props rejected
)
const userDataValidator = getValidator(userDataSchema, dataValidator)

// ─── Query schema ──────────────────────────────────────────────────────────────
const userQueryProperties = Type.Pick(userDataSchema, ['email'])
const userQuerySchema = Type.Intersect(
  [
    querySyntax(userQueryProperties),            // Feathers query helpers
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
const userQueryValidator = getValidator(userQuerySchema, queryValidator)

// ─── Hook registration ────────────────────────────────────────────────────────
app.service('users').hooks({
  around: {
    all: [
      schemaHooks.validateQuery(userQueryValidator), // validates ?query params
      schemaHooks.validateData(userDataValidator)    // validates request body
    ]
  }
})
```


## Category: input driven boundary selection

### Secure Routing and Parameter Mapping for Deep Links and Nested Resources

**Use when**

Building nested routes, deep links, or OAuth redirect flows in Feathers applications where route parameters and authentication tokens cross security boundaries.

**Secure rules**

**Rule 1: Explicitly map nested route parameters into service queries using hooks to prevent cross-tenant exposure.**

When handling nested service routes or deep links such as `/users/:userId/posts`, use service `before` hooks to explicitly copy route parameters from `context.params.route` into `context.params.query` and `context.data`.

```ts
app.use('/users/:userId/posts', app.service('posts'))

app.service('users/:userId/posts').hooks({
  before: {
    find: [
      async (context: HookContext) => {
        context.params.query = {
          ...context.params.query,
          userId: context.params.route.userId
        }
      }
    ]
  }
})
```

**Rule 2: Restrict OAuth redirect destinations using allowed origins configuration.**

Configure explicit allowed `origins` in the OAuth configuration to restrict valid post-authentication deep link redirect destinations and prevent open redirection vulnerabilities.

```json
{
  "authentication": {
    "oauth": {
      "origins": ["https://myapp.feathersjs.com", "http://localhost:3000"],
      "redirect": "https://myapp.feathersjs.com/"
    }
  }
}
```

**Rule 3: Scope nested route requests using route context parameters.**

When defining nested routes with path placeholders, use `params.route` to extract URL parameters and scope service logic strictly to the specified parent resource.

```js
app.use('users/:userId/messages', {
  async get(id, params) {
    const userId = params.route.userId
    return {
      id,
      userId,
      text: 'Feathers is great!'
    }
  }
})
```

**Rule 4: Namespace API service routes to prevent routing conflicts.**

Explicitly namespace API service routes under a dedicated path prefix like `/api/` when defining custom Express routes or view rendering paths alongside Feathers services to prevent route collisions and unintended bypass of security hooks.

```js
app.use('/api/messages', memory());

app.get('/messages', function(req, res, next) {
  app.service('api/messages')
    .find({ query: { $sort: { updatedAt: -1 } } })
    .then(result => res.render('message-list', result.data))
    .catch(next);
});
```


## Category: input interpretation safety

### Configure Query Parser Limits to Handle Array Inputs Securely

**Use when**

Configuring the express query parser in a Feathers application when handling URL query strings with large array parameters.

**Secure rules**

**Rule 1: Configure explicit array limits on the query string parser to prevent implicit type transformations.**

The default `qs` query string parser converts query arrays exceeding twenty items into standard JavaScript objects with numeric keys, which can disrupt schema validation and application logic. Set an explicit `arrayLimit` option when configuring the parser to ensure predictable input interpretation.

```typescript
import qs from 'qs'
import { feathers } from '@feathersjs/feathers'
import express from '@feathersjs/express'

const app = express(feathers())
app.set('query parser', (str: string) => qs.parse(str, { arrayLimit: 1000 }))
```


## Category: interface protocol hardening

### Secure Inter-Component Communication and Transport Boundaries

**Use when**

Use when designing inter-component calls, configuring service methods, managing real-time channels, and transferring authentication context across network and application component boundaries.

**Secure rules**

**Rule 1: Propagate authenticated entity context during internal service calls**

When performing internal inter-component service calls within the application, propagate the existing authenticated context directly in `params` instead of re-passing raw authentication credentials. This safely maintains identity and security context across component boundaries.

```ts
const userMessage = await app.service('messages').create(data, {
  ...context.params,
  authentication: context.params.authentication,
  user: context.params.user
})
```

**Rule 2: Restrict service methods exposed to remote client communications**

Explicitly declare the set of service methods accessible to remote clients using the `methods` option when calling `app.use()`. Omitting this option automatically exposes all standard service methods over configured network transports.

```ts
app.use('messages', new MessageService(), {
  methods: ['get', 'doSomething'],
  events: ['something']
})
```

**Rule 3: Manage channel memberships dynamically during authentication events**

Explicitly bind real-time connections to authorized channels on login and revoke channel access on logout or user role updates by moving connection objects out of anonymous channels and into authorized ones.

```ts
app.on('login', (payload: AuthenticationResult, { connection }: Params) => {
  if (connection) {
    app.channel('anonymous').leave(connection)
    app.channel('authenticated').join(connection)
    if (connection.user.isAdmin) {
      app.channel('admins').join(connection)
    }
  }
})
```

**Rule 4: Invoke services through `app.service(path)` to ensure hooks and security run**

Always call the standard service methods (`find`, `get`, `create`, `update`, `patch`, `remove`) on the instance returned by `app.service(path)`. This is the only way Feathers applies its built-in functionality—hooks, authentication/authorization, validation, events, pagination, etc. Avoid bypassing these controls:

* **Do not** call the original service class or object you registered with `app.use`.
* **Do not** use the underscore variants (`_get`, `_find`, `_create`, `_patch`, `_update`, `_remove`) unless you explicitly intend to skip hooks and related safeguards.

```ts
// Recommended: full Feathers processing (hooks, auth, events, etc.)
const item = await app.service('messages').get(1)

//  Bypasses hooks and other framework protections
// const rawService = new MessageService()
// const insecure = await rawService.get(1)
// const noHooks = await app.service('messages')._get(1)
```


## Category: output encoding

### Escape dynamic user content before inserting into HTML templates

**Use when**

Rendering dynamic user content or API responses into the browser DOM using properties like innerHTML.

**Secure rules**

**Rule 1: HTML-escape untrusted data before inserting it into HTML layout templates to prevent Cross-Site Scripting (XSS).**

Ensure that any dynamic content received from API endpoints or real-time events is properly HTML-escaped using utility functions that replace special characters such as `&`, `<`, and `>` before rendering them via `innerHTML` or similar properties.

```javascript
const escapeHTML = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const addMessage = (message) => {
  const chat = document.querySelector('#chat')
  const text = escapeHTML(message.text || '')
  if (chat) {
    chat.innerHTML += `<div class="chat-bubble">${text}</div>`
  }
}
```


## Category: resource exhaustion

### Limit File Upload Sizes and Payload Limits to Prevent Resource Exhaustion

**Use when**

When accepting multipart file uploads and parsing JSON request bodies in a Feathers application.

**Secure rules**

**Rule 1: Configure explicit file size boundaries and express json payload limits**

Avoid buffering arbitrary-sized Base64 DataURIs in memory. Configure explicit file size limits using `multer` and set payload limits via `express.json` to protect against excessive RAM consumption and Denial of Service attacks.

```javascript
const multer = require('multer');
const multipartMiddleware = multer({
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.use(express.json({ limit: '1mb' }));
app.use('/uploads', multipartMiddleware.single('uri'), blobService({ Model: blobStorage }));
```

**Rule 2: Enforce pagination limits in application configuration**

Configure both default and maximum pagination settings under the `paginate` key in application configuration to prevent API consumers from requesting unbounded result sets that can overload database services and lead to memory exhaustion.

```json
{
  "paginate": {
    "default": 10,
    "max": 100
  }
}
```


## Category: secret handling

### Configure Secure Storage Mechanisms for Client Authentication Tokens

**Use when**

Developing client-side applications with Feathers and configuring the `@feathersjs/authentication-client` module for token persistence.

**Secure rules**

**Rule 1: Explicitly configure a secure storage backend or memory-only storage engine instead of relying on default browser local storage for sensitive access tokens.**

When initializing the Feathers authentication client, supply an appropriate storage option such as `MemoryStorage` to prevent unauthorized client-side script extraction of tokens stored in `localStorage`.

```ts
import { feathers } from '@feathersjs/feathers'
import authentication, { MemoryStorage } from '@feathersjs/authentication-client'

const app = feathers()

app.configure(authentication({
  storage: new MemoryStorage(),
  storageKey: 'feathers-jwt'
}))
```

**Rule 2: Exclude private or sensitive application data from JWT payloads.**

Feathers JSON Web Tokens are signed rather than encrypted. Do not store sensitive secrets, keys, or private fields inside token payloads where they can be inspected on the client side.

```ts
// Secure: Store only necessary public identifiers
const payload = { sub: user.id };
```


### Load Secrets and API Credentials from External Configuration or Environment Variables

**Use when**

When configuring application authentication secrets, database connections, and third-party OAuth provider credentials.

**Secure rules**

**Rule 1: Load authentication and OAuth secrets from environment variables**

Map every sensitive value—JWT signing secret, OAuth client ID, and OAuth client secret—to environment variables in **`config/custom-environment-variables.json`** (or a compatible secret store) and load them at runtime with `@feathersjs/configuration`. This keeps credentials out of source control and lets you rotate them without code changes.

```ts
// .env  ────────────────────────────────────────────────────────────────
FEATHERS_SECRET=S3cr3tJWTKey
GITHUB_CLIENT_ID=gh_oauth_id
GITHUB_CLIENT_SECRET=gh_oauth_secret

// config/custom-environment-variables.json  ───────────────────────────
{
  "authentication": {
    "secret": "FEATHERS_SECRET",
    "oauth": {
      "github": {
        "key": "GITHUB_CLIENT_ID",
        "secret": "GITHUB_CLIENT_SECRET"
      }
    }
  }
}

// src/app.ts  ──────────────────────────────────────────────────────────
import * as dotenv from 'dotenv'          // loads .env → process.env
dotenv.config()

import configuration from '@feathersjs/configuration'
import { feathers } from '@feathersjs/feathers'

const app = feathers()
app.configure(configuration())            // merges config + env

console.log('JWT secret:', app.get('authentication').secret) // ✔ loaded from FEATHERS_SECRET
```

**Rule 2: Store Firebase service-account credentials in server-side configuration**

Keep the Firebase service-account JSON strictly on the backend:

* Add the full service-account object to `config/default.json` (or an environment-specific override).
* Load it at runtime with `@feathersjs/configuration` and `app.get('firebase')`.
* Initialize the Firebase Admin SDK with `firebase.credential.cert` so credentials never leave the server.

```js
// config/default.json
{
  "firebase": {
    "type": "service_account",
    "project_id": "my-firebase-project",
    "private_key": "-----BEGIN PRIVATE KEY-----\n...",
    "client_email": "firebase-adminsdk@my-firebase-project.iam.gserviceaccount.com"
  }
}

// src/firebase.js
const firebase = require('firebase-admin');

module.exports = app => {
  const serviceAccount = app.get('firebase');          // loaded from server config
  firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount)
  });
};
```


### Redact and Exclude Sensitive User Data from Response Payloads and Logs

**Use when**

When serializing database models or rendering API responses for external clients to prevent unauthorized exposure of sensitive user attributes and authentication credentials.

**Secure rules**

**Rule 1: Sanitize user data using external resolvers to remove sensitive fields before sending payloads to external clients.**

Use external resolvers to explicitly return undefined for sensitive user properties such as password hashes so they are never sent in API response payloads to external clients.

```typescript
export const userExternalResolver = resolve<User, HookContext>({
  // Ensure password is never sent to external clients
  password: async () => undefined
})
```

**Rule 2: Exclude sensitive local database files and coverage artifacts from version control.**

Ensure test database paths and local coverage output directories are explicitly listed in `.gitignore` to prevent leaking internal database records and temporary test state into code repositories.

```text
/data/
/test/data/
/.nyc_output/
```


## Category: security control integrity

### Prevent Security Control Bypasses by Routing Requests Through Feathers Services and Hooks

**Use when**

Developing Feathers service methods, custom authentication services, internal adapter operations, or handling request execution paths where security controls like hooks and setup initialization must remain consistently applied.

**Secure rules**

**Rule 1: Always call super.setup when subclassing AuthenticationService.**

When overriding the `setup` method in a custom `AuthenticationService` subclass, you must always invoke `super.setup(path, app)` to ensure signing secrets are validated and internal authentication hooks are correctly registered.

```typescript
class MyAuthService extends AuthenticationService {
  setup(path: string, app: Application) {
    super.setup(path, app)
    // Custom setup logic
  }
}
```

**Rule 2: Enforce security checks within Feathers hooks rather than Express middleware.**

Implement authorization checks, input validation, and access control inside Feathers hooks instead of Express middleware to prevent bypasses when clients communicate over non-REST transports such as WebSockets.

```typescript
app.service('todos').hooks({
  before: {
    all: [
      async (context) => {
        if (!context.params.user) {
          throw new Error('Not authenticated')
        }
      }
    ]
  }
})
```

**Rule 3: Manually enforce security validation when calling internal adapter methods.**

When invoking underscore-prefixed adapter methods such as `_find`, `_get`, `_update`, `_patch`, or `_remove`, recognize that they bypass standard hooks, and you must explicitly perform authorization checks and input validation inside your method body.

```typescript
import { KnexAdapter } from '@feathersjs/knex'
import { Forbidden } from '@feathersjs/errors'

export class MessageService extends KnexAdapter<Message, MessageData, MessageParams, MessagePatch> {
  async find(params: MessageParams) {
    if (!params.user) {
      throw new Forbidden('User must be authenticated')
    }
    const page = await this._find(params)
    return { status: 'ok', ...page }
  }
}
```


## Category: session management

### Invalidate Authentication Tokens Server-Side Upon Logout

**Use when**

Implementing logout functionality or managing server-side session and token invalidation in Feathers applications.

**Secure rules**

**Rule 1: Extend AuthenticationService to track and reject revoked tokens on the server.**

By default, valid JWTs remain usable until their expiration time. To ensure proper logout invalidation, extend `AuthenticationService` to store revoked access tokens in a shared store such as Redis and check token validity during `verifyAccessToken` and `remove` requests.

```js
const redis = require('redis');
const { AuthenticationService } = require('@feathersjs/authentication');
const { NotAuthenticated } = require('@feathersjs/errors');

class RedisAuthService extends AuthenticationService {
  constructor (app, configKey) {
    super(app, configKey);
    const client = redis.createClient();
    this.redis = client;
    (async () => {
      await this.redis.connect();
    })();
  }

  async revokeAccessToken (accessToken) {
    const verified = await this.verifyAccessToken(accessToken);
    const expiry = verified.exp - Math.floor(Date.now() / 1000);
    if (expiry > 0) {
      await this.redis.set(accessToken, '1', { EX: expiry });
    }
    return verified;
  }

  async verifyAccessToken (accessToken) {
    if (await this.redis.exists(accessToken)) {
      throw new NotAuthenticated('Token revoked');
    }
    return super.verifyAccessToken(accessToken);
  }

  async remove (id, params) {
    const authResult = await super.remove(id, params);
    const { accessToken } = authResult;
    if (accessToken) {
      await this.revokeAccessToken(accessToken);
    }
    return authResult;
  }
}

app.use('/authentication', new RedisAuthService(app));
```

**Rule 2: Invoke app.logout() on the client to clear local credentials and invoke server removal.**

When ending a user session, always call `app.logout()` instead of manually clearing local storage keys. This ensures the access token is removed from client storage and the `remove` method is invoked on the server authentication service.

```ts
async function handleUserLogout(app: any) {
  try {
    await app.logout()
    showLoginPage()
  } catch (error) {
    console.error('Logout failed', error)
  }
}
```
