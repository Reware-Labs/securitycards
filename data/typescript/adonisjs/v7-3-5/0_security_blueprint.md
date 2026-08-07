# Security blueprint

Repository: `https://github.com/adonisjs/core#v7.3.5`

## Security posture

AdonisJS provides a robust framework-level security baseline protecting applications against request smuggling, CSRF, and common injection flaws by default through integrated packages and robust defaults. Developers must actively secure explicit trust boundaries, including database queries, validation results, authentication credentials, authorization policies, and session state. Sensitive operations, dynamic providers, file uploads, and configuration overrides must fail closed when validation or policy checks fail.

## Essential implementation rules

1. **Enforce Explicit Authorization and Bouncer Policies**

Always call bouncer methods such as `bouncer.authorize()` or `bouncer.with().authorize()` within your controller actions to enforce ownership boundaries and prevent insecure direct object references. When writing custom authorization middleware, return an explicit error response or throw an exception upon failure, and never invoke `await next()` when checks fail. Ensure policy `before()` hooks return `undefined` by default so execution proceeds correctly to specific action methods.

2. **Validate Granular Token Abilities and Real-Time Channels**

Specify explicit permission strings when creating user access tokens and enforce those abilities using `token.allows()`. Explicitly authorize sensitive Server-Sent Event channels by registering authorization callbacks using `transmit.authorize()` to ensure unauthenticated clients cannot subscribe to private real-time streams.

3. **Validate Incoming Request Payloads and Try-Validate Results**

Always validate incoming request data using `request.validateUsing()` or `request.tryValidateUsing()` to establish a clear trust boundary at the controller entry point. When using `tryValidateUsing`, verify that the returned error element in the tuple is null before accessing the data object.

4. **Verify Credentials, Session Security, and Token Expiration**

Apply the withAuthFinder mixin to Lucid models and use `User.verifyCredentials` to prevent timing attacks, and always configure explicit expiration times using `expiresIn` when issuing access tokens. Ensure session cookies have `httpOnly: true`, secure transport enabled in production, and `sameSite` set to `'lax'` or `'strict'`.

5. **Harden Configuration Sources and Environment Variables**

Validate environment variables using strict schema definitions like `Env.schema.enum()` to restrict allowed configuration values and prevent fallback to unintended storage backends. Always load sensitive credentials and keys via `env.get()` and omit sensitive keys from example environment files.

6. **Apply Argon2 Hashing and Authenticated Encryption**

Configure Argon2 using the `id` variant to process long passwords and prevent silent truncation beyond 72 bytes. Use modern authenticated encryption drivers like `aes256gcm` and specify distinct purpose options during encryption and decryption to prevent cross-context token reuse.

7. **Protect State-Changing Forms with CSRF Tokens**

Include the `{{ csrfField() }}` helper inside every server-rendered form when using `@adonisjs/shield` CSRF protection to ensure state-changing submissions include a valid token.

8. **Secure File Handling, Uploads, and Downloads**

Validate route parameters and construct file paths securely using `app.makePath()` when serving file downloads. Enforce explicit file size limits and allowed extension constraints on uploads, generate unique random filenames via `string.uuid()`, and store only relative file keys in the database.

9. **Prevent SQL Injection with Parameterized Queries**

Prevent SQL injection vulnerabilities by using Lucid query builder methods or by passing parameter bindings explicitly when using raw queries via `db.rawQuery`, avoiding manual string interpolation of dynamic inputs.

10. **Validate Dynamic Providers and Verification Tokens**

Allowlist and validate dynamic provider inputs prior to client invocation using `ally.has()` and route constraints. Use `VerificationToken.decode()` and handle null return values explicitly to prevent decoding errors and verification bypasses.

11. **Harden Static Files, Proxies, and Request Body Limits**

Configure custom headers on static file responses via `config/static.ts` to attach `X-Content-Type-Options` and `X-Frame-Options`. Specify trusted proxy IP addresses using `proxyAddr.compile` in HTTP settings and enforce explicit request size limits in `config/bodyparser.ts` to prevent resource exhaustion.

12. **Escape Dynamic Interpolation in Translated Templates**

Use standard double curly braces `{{ t(...) }}` rather than unescaped triple curly braces when outputting internationalized messages in Edge templates to automatically HTML-escape dynamic interpolation parameters and prevent XSS.

13. **Redact Sensitive Data and Enforce Production Environment**

Configure global key redaction paths in `config/logger.ts`, wrap sensitive data inside `Secret` instances, and exclude sensitive fields using `session.flashExcept()`. Ensure `NODE_ENV` is set to production to disable development route generation and debugging metadata files.
