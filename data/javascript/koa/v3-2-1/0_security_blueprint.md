# Security blueprint

Repository: `https://github.com/koajs/koa#v3.2.1`

## Security posture

The Koa repository provides a lightweight middleware framework that requires developers to explicitly implement security controls, state management, and error handling. Koa protects against basic HTTP routing complexities and handles automatic response pipelines, but it does not protect by default against session forgery, missing authorization checks, improper MIME-sniffing, insecure proxy configurations, or unvalidated inputs. Developers must treat context state, session cookies, input media types, and reverse proxy boundaries as critical security surfaces that fail closed when misconfigured.

## Essential implementation rules

1. **Enforce Authorization and State Isolation**

Attach authenticated user records and authorization scopes to `ctx.state` and use `ctx.assert(ctx.state.user, 401, ...)` to reject unauthenticated requests before executing restricted handlers. Because Koa resets `ctx.state` per request, attaching identity objects here ensures safe request-scoped isolation.

2. **Configure Signed Session Cookies with Secure Attributes**

Load long, cryptographically random signing secrets from environment variables into `app.keys` as an array to support key rotation. When issuing session tokens via `ctx.cookies.set()`, explicitly enable `signed: true`, `httpOnly: true`, `secure: true`, and `sameSite: 'lax'` or `'strict'`.

3. **Enable Request Context Isolation and Explicit Production Mode**

Initialize Koa with `{ asyncLocalStorage: true }` to maintain safe context isolation across asynchronous boundaries and event listeners. Explicitly set the environment mode during application instantiation or via `process.env.NODE_ENV` to prevent leaking stack traces and detailed error information.

4. **Validate Content Types and Adapt Query Parameter Handling**

Verify incoming request content types using `ctx.is()` before processing payloads, throwing an HTTP 415 error for unsupported types. In Koa v3, use standard `URLSearchParams` methods like `.get()` and `.getAll()` on `ctx.querystring` to retrieve and validate input parameters.

5. **Secure Reverse Proxy and Subdomain Boundary Settings**

Enable `app.proxy = true` only when running behind a trusted reverse proxy that sanitizes `X-Forwarded-*` headers, and configure `app.subdomainOffset` accurately to prevent host header spoofing and boundary manipulation.

6. **Safely Handle File Downloads and MIME-Type Sniffing**

When serving static files or downloadable attachments, set an explicit Content-Type like `application/octet-stream` and invoke `ctx.attachment(filename)` to enforce proper `Content-Disposition` headers and prevent browser MIME-sniffing.

7. **Maintain Middleware Flow and Proper Error Handling**

Ensure all non-terminal middleware explicitly calls and returns `next()` to maintain the execution chain and prevent security controls from being bypassed. When throwing HTTP errors using `ctx.throw()` in Koa v3, pass an explicit `Error` instance as the second argument rather than legacy string messages.

8. **Manage Native Responses Securely and Prevent Injection**

When bypassing Koa's response pipeline by setting `ctx.respond = false`, manually finalize the native stream, set required security headers, and ensure the connection ends. For raw string responses, explicitly set `ctx.type` to prevent unwanted HTML interpretation or injection.
