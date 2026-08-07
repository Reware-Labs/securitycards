# Security cards

Repository: `https://github.com/adonisjs/core#v7.3.5`
Documentation repository: `https://github.com/adonisjs/v7-docs#main`

## Category: access control

### Enforce Authorization Checks and Bouncer Policies on Protected Resources

**Use when**

When implementing controller actions, route handlers, or middleware that handle sensitive data mutations, access control, or resource retrieval.

**Secure rules**

**Rule 1: Explicitly authorize user actions using Bouncer methods before executing sensitive operations.**

Always call bouncer methods such as bouncer.authorize() or bouncer.with().authorize() within your controller actions to enforce ownership and permission boundaries and prevent insecure direct object references.

```typescript
import Post from '#models/post'
import PostPolicy from '#policies/post_policy'
import type { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  async delete({ bouncer, params, response }: HttpContext) {
    const post = await Post.findOrFail(params.id)
    await bouncer.with(PostPolicy).authorize('delete', post)
    await post.delete()
    return { message: 'Post deleted successfully' }
  }
}
```

**Rule 2: Terminate the middleware request pipeline immediately when authorization checks fail**

When writing custom authorization middleware, return an explicit error response or throw an exception upon authorization failure, and never invoke await next() when checks fail.

```typescript
export default class AuthorizeRequestMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn, options: { role: string }) {
    const user = auth.getUserOrFail()
    if (user.role !== options.role) {
      return response.unauthorized('Not authorized to access this route')
    }
    await next()
  }
}
```


### Restrict Granular Token Abilities and Channel Access Control

**Use when**

When issuing API access tokens, defining token capabilities, or authorizing real-time Server-Sent Event channels.

**Secure rules**

**Rule 1: Assign granular abilities to API tokens rather than wildcard permissions.**

Specify explicit permission strings when creating user access tokens and enforce those abilities within your route handlers using token.allows() to follow the principle of least privilege.

```typescript
// Creating token with limited capabilities
const token = await User.accessTokens.create(user, ['projects:read'])

// Checking abilities on protected routes
router.delete('/projects/:id', async ({ auth, response }) => {
  if (!auth.user!.currentAccessToken.allows('projects:delete')) {
    return response.forbidden('Token lacks projects:delete ability')
  }
  // Proceed with deletion...
}).use(middleware.auth({ guards: ['api'] }))
```

**Rule 2: Explicitly authorize sensitive Server-Sent Event channels.**

Register authorization callbacks using transmit.authorize() to ensure that unauthenticated or unauthorized clients cannot subscribe to private real-time channels.

```typescript
import transmit from '@adonisjs/transmit/services/main'
import Chat from '#models/chat'

transmit.authorize<{ chatId: string }>(
  'chats/:chatId/messages',
  async (ctx, { chatId }) => {
    const chat = await Chat.findOrFail(+chatId)
    return ctx.bouncer.allows('accessChat', chat)
  }
)
```


## Category: api contract misuse

### Verify validation results and handle error tuples correctly when using tryValidateUsing

**Use when**

Validating incoming request input using tryValidateUsing in AdonisJS controllers and inspecting the resulting error tuple.

**Secure rules**

**Rule 1: Check the error tuple element returned by tryValidateUsing before using validated data**

When calling `ctx.request.tryValidateUsing()`, verify that the returned `error` element in the tuple is null before accessing the data object. Failing to check the error value can result in accessing null data and bypassing validation controls.

```typescript
export default class ProfileController {
  async update({ request, response }: HttpContext) {
    const [error, data] = await request.tryValidateUsing(profileValidator)
    if (error) {
      return response.unprocessableEntity(error.messages)
    }

    await updateProfile(data)
  }
}
```


## Category: authentication

### Verify User Credentials and Enforce Token Expiration

**Use when**

Verifying user credentials during authentication or validating token-based and verification tokens.

**Secure rules**

**Rule 1: Use secure password verification methods and ensure tokens enforce expiration limits.**

Apply the withAuthFinder mixin to Lucid models and use User.verifyCredentials to prevent timing attacks, and always configure explicit expiration times using the expiresIn option when issuing access tokens.

```typescript
static accessTokens = DbAccessTokensProvider.forModel(User, {
  expiresIn: '30 days',
  prefix: 'oat_',
  table: 'auth_access_tokens',
  type: 'auth_token',
  tokenSecretLength: 40,
})
```

**Rule 2: Validate token signatures, payload structure, and expiration timestamps before granting authentication.**

Verify token signatures, validate the payload structure, check token expiration using token.isExpired(), and verify that the user retrieved from the token payload still exists in the backing store.

```typescript
const decoded = UserVerificationToken.decode(userProvidedToken)
if (!decoded) {
  return response.badRequest('Invalid token format')
}

const token = await UserVerificationToken.find(decoded.identifier)
if (!token || token.isExpired() || !token.verify(decoded.secret)) {
  return response.unauthorized('Token is invalid or has expired')
}
```


## Category: boundary control

### Validate incoming request payloads at controller entry

**Use when**

Processing incoming HTTP request data inside controllers before executing core business logic.

**Secure rules**

**Rule 1: Validate all incoming request data using `request.validateUsing()` before executing any business logic.**

Always validate request parameters through `request.validateUsing()` using a defined validator to establish a clear trust boundary at the controller entry point. Operate exclusively on the returned validated payload rather than trusting raw request inputs.

```typescript
import { createPostValidator } from '#validators/post'
import type { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  async store({ request }: HttpContext) {
    const payload = await request.validateUsing(createPostValidator)
    // Process strictly using validated payload
  }
}
```


## Category: configuration source integrity

### Validate configuration source values using strict environment schemas

**Use when**

Validating and restricting allowed environment variables at application startup to ensure configuration integrity.

**Secure rules**

**Rule 1: Validate environment variables using strict schema definitions to restrict allowed configuration values.**

Use `Env.schema.enum()` inside `start/env.ts` to explicitly validate environment variables like `LIMITER_STORE` against a fixed set of trusted options. This prevents unexpected configuration overrides or fallback to unintended storage backends.

```typescript
import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  LIMITER_STORE: Env.schema.enum(['redis', 'database', 'memory'] as const),
})
```


## Category: cryptography

### Configure Secure Password Hashing with Argon2

**Use when**

Implementing user authentication and password storage mechanisms in AdonisJS applications.

**Secure rules**

**Rule 1: Select Argon2 or Scrypt as the password hashing driver to avoid bcrypt truncation issues.**

Configure Argon2 using the `id` variant in `config/hash.ts` to properly process long passwords and prevent silent truncation beyond 72 bytes.

```typescript
import { defineConfig, drivers } from '@adonisjs/core/hash'

export default defineConfig({
  default: 'argon',
  list: {
    argon: drivers.argon2({
      variant: 'id',
      version: 0x13,
      iterations: 3,
      memory: 65536,
      parallelism: 4,
    }),
  },
})
```


### Use Authenticated Encryption with Purpose Binding

**Use when**

Encrypting sensitive payloads or tokens requiring confidentiality and integrity guarantees across distinct application contexts.

**Secure rules**

**Rule 1: Specify purpose options during encryption and decryption to prevent cross-context token reuse.**

Pass a distinct purpose string when encrypting data to bind the purpose to the ciphertext authentication tag. Always verify that decryption returns non-null output before using the payload.

```typescript
import encryption from '@core/services/encryption'

const resetToken = encryption.encrypt(
  { userId: 1 },
  { purpose: 'password-reset' }
)

const payload = encryption.decrypt(resetToken, 'password-reset')
if (!payload) {
  // Handle invalid context or tampered token
}
```

**Rule 2: Select modern authenticated encryption drivers such as AES-256-GCM or ChaCha20-Poly1305 for new data.**

Configure application encryption with authenticated encryption algorithms using `defineConfig` to ensure both data confidentiality and authenticity.

```typescript
import { defineConfig, drivers } from '@adonisjs/core/encryption'
import env from '#start/env'

export const encryptionConfig = defineConfig({
  default: 'app',
  list: {
    app: drivers.aes256gcm({
      id: 'app',
      keys: [env.get('APP_KEY')],
    }),
  },
})
```


## Category: csrf

### Include CSRF field tokens in server-rendered forms

**Use when**

Developing server-rendered form submissions using AdonisJS Shield.

**Secure rules**

**Rule 1: Include the CSRF token helper in every server-rendered form.**

Include the `{{ csrfField() }}` helper inside every server-rendered form when using `@adonisjs/shield` CSRF protection to ensure state-changing submissions include a valid token.

```html
<form method="POST" action="/posts">
  {{ csrfField() }}
  <input type="text" name="title">
  <button type="submit">Submit</button>
</form>
```


## Category: file handling

### Validate paths and enforce size, extension, and uniqueness constraints on file uploads

**Use when**

When handling user-uploaded files, defining storage paths, or serving file downloads to prevent path traversal and resource exhaustion.

**Secure rules**

**Rule 1: Validate route parameters and construct file paths securely using app.makePath() when serving downloads.**

Ensure file paths are constructed securely using `app.makePath()` and validate input parameters to prevent path traversal attacks when serving file downloads using `response.download()` or `response.attachment()`.

```typescript
import app from '@adonisjs/core/services/app'
import type { HttpContext } from '@adonisjs/core/http'

export default class InvoicesController {
  async download({ response, params }: HttpContext) {
    const filePath = app.makePath(`storage/invoices/${params.id}.pdf`)
    response.download(filePath)
  }
}
```

**Rule 2: Enforce explicit size limits and allowed extension constraints on uploads**

Enforce explicit file size limits and allowed extension constraints when handling user uploads via `request.file()` or validator schemas to protect against resource exhaustion or arbitrary file execution.

```typescript
import router from '@adonisjs/core/services/router'

router.post('/avatar', ({ request }) => {
  const avatar = request.file('avatar', {
    size: '2mb',
    extnames: ['jpg', 'png', 'jpeg']
  })
  if (!avatar || !avatar.isValid) {
    return avatar?.errors
  }
})
```

**Rule 3: Generate unique random filenames and store relative keys safely.**

Generate unique, random filenames such as UUIDs via `string.uuid()` when saving user-uploaded files using `moveToDisk` and store only the relative file key in the database rather than untrusted user filenames.

```typescript
const key = `${string.uuid()}.${avatar.extname ?? 'txt'}`
await avatar.moveToDisk(key)
user.avatar = key
await user.save()
```


## Category: injection

### Use Parameterized Queries and Query Builder to Prevent SQL Injection

**Use when**

Building database queries with dynamic user input using Lucid query builder or raw queries.

**Secure rules**

**Rule 1: Use Lucid's fluent query builder or parameterized raw queries instead of manually interpolating dynamic inputs into raw SQL strings.**

Prevent SQL injection vulnerabilities by using Lucid query builder methods or by passing parameter bindings explicitly when using raw queries via `db.rawQuery`.

```typescript
// Safe: using query builder with parameterized arguments
const posts = await db
  .from('posts')
  .select('*')
  .where('status', request.input('status'))

// Safe: passing array bindings with rawQuery
const dynamicStatus = request.input('status')
const rawResult = await db.rawQuery('select * from posts where status = ?', [dynamicStatus])
```


## Category: input driven boundary selection

### Validate dynamic provider parameters before invoking drivers

**Use when**

When handling dynamic route parameters to select an OAuth provider or adapter in AdonisJS applications.

**Secure rules**

**Rule 1: Allowlist and validate dynamic provider inputs prior to client invocation.**

Check whether the provider is supported using `ally.has(params.provider)` and restrict expected parameters using route constraints like `.where('provider', /github|google|twitter/)` before calling `ally.use(params.provider)`.

```typescript
router
  .get('/:provider/redirect', ({ ally, params, response }) => {
    if (!ally.has(params.provider)) {
      return response.badRequest('Invalid OAuth provider')
    }
    return ally.use(params.provider).redirect()
  })
  .where('provider', /github|google|twitter/)
```


## Category: input interpretation safety

### Safely Decode and Handle Incoming Verification Tokens

**Use when**

Parsing and processing incoming user verification tokens in request handlers.

**Secure rules**

**Rule 1: Always use VerificationToken.decode() and explicitly handle null return values to prevent inconsistent parsing bugs and token verification bypasses.**

When decoding incoming verification tokens, developers must use `VerificationToken.decode()` and handle `null` return values. The decoder strictly validates base64 URL encoding and structure, returning `null` for malformed, empty, or incomplete tokens without throwing unhandled exceptions.

```typescript
const tokenString = request.input('token')
const decoded = VerificationToken.decode(tokenString)

if (!decoded) {
  return response.badRequest('Invalid token format')
}
```


## Category: interface protocol hardening

### Set security headers on served static files using header callbacks

**Use when**

Configuring the static file server to attach security-focused HTTP headers to protect against protocol confusion and MIME-sniffing vulnerabilities.

**Secure rules**

**Rule 1: Configure custom headers on static file responses to enforce protocol-level protections such as preventing MIME-sniffing and framing attacks.**

Use the `headers` configuration option in `config/static.ts` to inspect file paths and attach relevant HTTP security headers like `X-Content-Type-Options` and `X-Frame-Options` to responses.

```typescript
import { defineConfig } from '@adonisjs/static'

export default defineConfig({
  headers: (filePath) => {
    if (filePath.endsWith('.html')) {
      return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    }
  }
})
```


## Category: network boundary

### Configure explicit trusted proxy IP addresses in HTTP settings

**Use when**

Configuring AdonisJS HTTP settings behind a proxy to ensure correct handling of client IP addresses and prevent spoofing.

**Secure rules**

**Rule 1: Specify trusted proxy IP addresses or ranges using `proxyAddr.compile` instead of enabling wildcard proxy trust.**

Set `trustProxy` in `config/app.ts` using `proxyAddr.compile` with explicit ranges like `loopback` or `uniquelocal` to prevent external clients from forging `X-Forwarded-For` and other proxy headers.

```typescript
import { defineConfig } from '@adonisjs/core/http'
import proxyAddr from 'proxy-addr'

export const http = defineConfig({
  trustProxy: proxyAddr.compile(['loopback', 'uniquelocal'])
})
```


## Category: output encoding

### Escape Dynamic Values in Translated Edge Templates

**Use when**

Rendering internationalized translation strings with dynamic user-supplied interpolation parameters inside Edge templates.

**Secure rules**

**Rule 1: Use default double curly braces for rendering translations to automatically HTML-escape dynamic interpolation parameters.**

When outputting translated messages using `t(...)` in Edge templates, rely on standard double curly braces `{{ t(...) }}` rather than unescaped triple curly braces `{{{ t(...) }}}`. This ensures that any user-supplied interpolation variables are safely HTML-escaped to prevent Cross-Site Scripting vulnerabilities.

```edge
{{-- Secure: Escapes dynamic values automatically --}}
{{ t('messages.greeting', { username: user.name }) }}
```


## Category: resource exhaustion

### Configure request body parser limits to prevent denial of service

**Use when**

Defining body parser configurations to restrict incoming payload sizes for JSON, form, and multipart requests in AdonisJS applications.

**Secure rules**

**Rule 1: Enforce strict request size limits using the limit and fieldsLimit options across body parsers.**

Configure explicit limit values for all configured parsers in `config/bodyparser.ts` to protect the application from Denial of Service attacks caused by excessively large request bodies or field payloads.

```typescript
import { defineConfig } from '@adonisjs/core/bodyparser'

const bodyParserConfig = defineConfig({
  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  json: {
    limit: '1mb',
  },
  form: {
    limit: '1mb',
  },
  multipart: {
    limit: '20mb',
    fieldsLimit: '2mb',
  },
})

export default bodyParserConfig
```


## Category: runtime environment hardening

### Set production environment to disable development route generation and debugging features

**Use when**

Deploying the application to a production server where development route generation and debug tooling must be disabled.

**Secure rules**

**Rule 1: Ensure NODE_ENV is set to production to prevent writing development route files to disk.**

Configure the production server environment to run with the production flag set so that providers inspect app.inProduction correctly and avoid generating routes.json metadata files.

```bash
NODE_ENV=production node bin/server.js
```


## Category: secret handling

### Load credentials and secrets using environment variables

**Use when**

Configuring application settings, encryption keys, database connections, mail services, storage drivers, authentication guards, and API integrations.

**Secure rules**

**Rule 1: Load sensitive credentials and keys strictly from environment variables instead of hardcoding them in source files.**

Always fetch sensitive values like `APP_KEY`, database passwords, cloud storage credentials, and API keys using `env.get()` within configuration files and make sure to validate that all required secret parameters are non-empty strings.

```typescript
import env from '#start/env'
import { defineConfig, drivers } from '@adonisjs/core/encryption'

export const encryptionConfig = defineConfig({
  default: 'app',
  list: {
    app: drivers.aes256gcm({
      id: 'app',
      keys: [env.get('APP_KEY')],
    }),
  },
})
```

**Rule 2: Omit sensitive secret values from example environment files.**

When defining environment variables programmatically, pass sensitive key names in the `omitFromExample` option array so that secret default values are excluded from `.env.example`.

```typescript
await codemods.defineEnvVariables(
  {
    API_KEY: 'secret-key-here',
  },
  {
    omitFromExample: ['API_KEY']
  }
)
```


### Redact and protect sensitive tokens and secrets during runtime handling

**Use when**

Handling plain-text tokens, logging application messages, rendering user inputs or models, and managing terminal or REPL prompts.

**Secure rules**

**Rule 1: Redact or exclude sensitive credentials and token fields from logs, session state, and outputs.**

Configure global key redaction paths in `config/logger.ts`, wrap sensitive data inside `Secret` instances prior to logging or verification, and explicitly exclude sensitive user inputs using `session.flashExcept()`.

```typescript
import { defineConfig } from '@adonisjs/core/logger'

export default defineConfig({
  loggers: {
    app: {
      redact: {
        paths: ['password', '*.password', 'creditCard', 'token'],
        censor: '[REDATED]'
      }
    }
  }
})
```

**Rule 2: Avoid exposing raw unhashed token values or logging plain text secrets.**

Only expose plain access token strings immediately upon creation using `token.value!.release()` when responding to the client, and never store or log plain text token strings on the server.

```typescript
router.post('/users/:id/tokens', async ({ params }) => {
  const user = await User.findOrFail(params.id)
  const token = await User.accessTokens.create(user)

  return {
    type: 'bearer',
    value: token.value!.release(),
  }
})
```


## Category: security control integrity

### Prevent Authorization Policy Bypass by Returning Undefined

**Use when**

Developing policy classes with `before()` hooks to control access to specific authorization actions in AdonisJS.

**Secure rules**

**Rule 1: Ensure policy before hooks return undefined to fall back to specific action methods unless overriding globally.**

When implementing a `before()` hook in a policy class, only return an explicit boolean value if you intend to completely short-circuit and bypass all other authorization rules. For standard access control flows where specific method rules must execute, make sure the `before()` hook returns `undefined` by default so execution proceeds correctly to the targeted action methods.

```typescript
import User from '#models/user'
import Post from '#models/post'
import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class PostPolicy extends BasePolicy {
  before(user: User | null, action: string, ...params: any[]) {
    if (user && user.role === 'admin') {
      return true
    }
  }

  edit(user: User, post: Post): AuthorizerResponse {
    return user.id === post.userId
  }
}
```


## Category: session management

### Configure secure session cookie attributes

**Use when**

Configuring session cookie security options in AdonisJS applications

**Secure rules**

**Rule 1: Enable HttpOnly, secure transport, and SameSite policies on session cookies**

When configuring session settings in `config/session.ts`, ensure `cookie.httpOnly` is set to `true`, `cookie.secure` is enabled for HTTPS using `app.inProduction`, and `cookie.sameSite` is set to `'lax'` or `'strict'` to prevent XSS session theft and CSRF.

```typescript
export default defineConfig({
  enabled: true,
  cookieName: 'adonis-session',
  clearWithBrowser: false,
  age: '2h',
  cookie: {
    path: '/',
    httpOnly: true,
    secure: app.inProduction,
    sameSite: 'lax',
  },
  store: env.get('SESSION_DRIVER'),
})
```
