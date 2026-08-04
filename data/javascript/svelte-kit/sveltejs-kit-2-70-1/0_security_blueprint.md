# Security blueprint

Repository: `https://github.com/sveltejs/kit#@sveltejs/kit@2.70.1`

## Security posture

Developers must assume a secure-by-default boundary model where server-side boundaries, route handlers, and request hooks govern authorization and data flow. The library protects sensitive server modules and private environment variables from client exposure by default, but developers must explicitly configure origin validation, session handling, body size limits, and input schemas. All untrusted inputs, external links, file uploads, and error responses must be rigorously validated and sanitized to fail closed under failure conditions.

## Essential implementation rules

1. **Verify Server-Side Authentication and Authorization**

Inspect authentication tokens or cookies inside `src/hooks.server.js` to populate `event.locals` reliably. Always enforce server load functions and remote endpoint checks against `locals` before returning protected data, triggering `redirect(...)` for unauthenticated sessions and `error(403)` for unauthorized access.

2. **Configure Explicit Production Origin and CORS Headers**

Define the full deployment origin via the `ORIGIN` environment variable to allow accurate cross-site request forgery protection and origin validation. Explicitly add required `Access-Control-Allow-Origin` and `Access-Control-Allow-Methods` headers to production `OPTIONS` handlers.

3. **Validate Input Schemas, Route Parameters, and File Uploads**

Enforce strict schema validation on environment variables using Standard Schema validators inside `defineEnvVars`. Validate remote function parameters, rest parameter paths, and file fields using appropriate validators and custom route param matchers while ensuring multipart encoding is properly configured.

4. **Enforce Secure Cookie Attributes and Explicit Session Invalidation**

Set explicit security options including `path: '/'`, `httpOnly: true`, and `secure: true` on all session cookies. Invalidate session states and clear session cookies along with `event.locals.user` upon user logout.

5. **Protect Private Secrets and Configure Cryptographic Randomness**

Store sensitive keys exclusively in server-only locations and private environment modules such as `$lib/server` or `$env/static/private`. Exclude sensitive credentials from form action validation error returns, and use the global `crypto.randomUUID()` method for secure random identifier generation.

6. **Sanitize Error Responses and Ensure Fail-Closed Handlers**

Implement custom error handling hooks that log full exception details securely on the server while returning sanitized, generic error messages and tracking IDs to the client. Ensure that error handling hooks do not throw unhandled exceptions.

7. **Set Security Headers and Manage Immutable Response Objects**

Configure cache control and security headers safely within load functions using `setHeaders`. When modifying headers inside server hooks, wrap response headers using `new Headers(response.headers)` and construct a new `Response` object to prevent immutability errors.

8. **Restrict Payload Sizes and Link Preloading Options**

Maintain request body payload limits using the `BODY_SIZE_LIMIT` configuration to prevent server resource exhaustion. Configure anchor tags on routes with side-effects by setting `data-sveltekit-preload-data` to `false` or `tap` to prevent premature load function execution.

9. **Isolate Client Navigation and Strip Debug Components**

Use SvelteKit's `goto(...)` navigation function strictly for internal routes and rely on `window.location.href` for external destinations. Configure debug toggles as static public environment variables using `defineEnvVars` with `static: true` to enable compile-time dead-code elimination in production builds.
