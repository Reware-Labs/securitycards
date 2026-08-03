# Security blueprint

Repository: `https://github.com/honojs/hono#v4.12.32`

## Security posture

Developers working with Hono must assume a multi-layered security posture where authentication, input boundaries, and transport protections are explicitly configured and enforced across all routes. While Hono provides robust primitives like `jwt()`, `csrf()`, and `secureHeaders()`, developers remain responsible for validating payloads, managing request state isolation, and ensuring cryptographic secrets never leak. Security-sensitive surfaces include dynamic routing parameters, file uploads, static asset serving, and unvalidated proxy headers, all of which must fail closed when validation checks fail.

## Essential implementation rules

1. **Enforce Strict IP Restrictions and Trusted Connection Info**

Configure `ipRestriction` middleware using explicit allow lists and deny lists with trusted connection info functions like `getConnInfo`. Ensure that deny lists evaluate before allow lists, and never rely on unvalidated headers such as `X-Forwarded-For` unless operating behind a trusted reverse proxy.

2. **Centralize Error Handling and Sanitize Client Responses**

Register a centralized `app.onError` handler to intercept uncaught exceptions and return sanitized error responses while logging raw stack traces securely on the server. Wrap authentication and JWT verification calls in `try/catch` blocks to translate token expiration or invalidity into explicit `401` or `403` HTTP responses.

3. **Use Hono Request Body Methods for Cloning and Re-Readability**

Consume incoming request bodies using methods like `c.req.json()`, `c.req.text()`, or `c.req.parseBody()` rather than reading `c.req.raw` body streams directly. This populates `bodyCache` correctly and enables features like `cloneRawRequest` without triggering internal server errors.

4. **Authenticate Requests Using Timing-Safe Comparisons and Explicit Tokens**

Protect endpoints with `basicAuth` and `bearerAuth` middleware utilizing strict verification callbacks, static tokens, or timing-safe comparisons. Ensure successful authentication populates request-scoped context state cleanly via `c.set()`.

5. **Validate JWT Signatures, Algorithms, and Trusted JWKS Sources**

Enforce explicit signature algorithms (`alg`) and secrets or trusted `jwks_uri` keys when registering `jwt()` or `jwk()` middleware. Always call `verify()` to validate claims like `exp`, `nbf`, `iss`, and `aud` before trusting payload contents, and avoid using unverified `decode()` or `decodeHeader()` payloads.

6. **Isolate Request State Using Context Set and Get Methods**

Store per-request metadata and authentication state strictly using `c.set()` during middleware execution and retrieve it via `c.get()` or `c.var` within route handlers. This prevents shared state from bleeding between concurrent requests across asynchronous execution contexts.

7. **Import Hono Modules from Trusted Registry Sources**

Import Hono packages in runtime environments like Deno directly from official verified registries such as JSR (`jsr:@hono/hono`) to guarantee access to official maintenance releases, security updates, and context-isolation patches.

8. **Use Secure Cryptographic Primitives and Handle Web Crypto Availability**

Check for `null` return values when calling Subtle Crypto utilities like `sha256` or `createHash`, and constrain allowed asymmetric algorithms when performing JWKS verification. Verify HMAC-signed cookies with `parseSigned` to ensure the returned value is not `false`.

9. **Protect State-Changing Routes Against CSRF and Validate Origins**

Apply Hono's `csrf()` middleware to validate `Origin` and `Sec-Fetch-Site` headers on non-GET and non-HEAD HTTP methods. Configure explicit allowed origins or custom validation callbacks to block unauthorized cross-site submissions.

10. **Sanitize Untrusted Content and Avoid Unsafe HTML Rendering**

Keep untrusted strings inside escaped Hono tagged template interpolations rather than raw HTML utilities like `raw()` or `dangerouslySetInnerHTML`. Compose dynamic CSS classes securely using Hono's `cx()` helper to prevent attribute-breaking injections.

11. **Prevent Path Traversal When Serving Static Files and Uploads**

Configure `serveStatic` using explicit root directories and manifests to prevent directory traversal vulnerabilities. Enforce `bodyLimit` middleware prior to multipart form parsing, and validate file metadata including size, MIME type, and filename before processing uploads.

12. **Validate Input Presence, Types, and Language Whitelists**

Validate required JSON fields and data shapes inside validator callbacks before application logic consumes them via `c.req.valid('json')`. Enforce strict whitelists of permitted codes when configuring language detection features.

13. **Access Request Parameters Safely Using Prototype-less Dictionaries**

Retrieve request parameters, query strings, and headers using direct key lookups or indirect method invocations (`Object.prototype.hasOwnProperty.call()`). Hono parses these metadata dictionaries into prototype-less objects created via `Object.create(null)` that do not inherit standard `Object.prototype` methods.

14. **Configure Secure Response Headers and CSP Nonces**

Apply Hono's `secureHeaders` middleware to enforce strict HTTP security headers, including Content Security Policy, HSTS, and X-Frame-Options. Use the `NONCE` helper and access `c.get('secureHeadersNonce')` when rendering inline scripts to prevent script injection.

15. **Enforce Strict Connection Processing and Proxy Framing**

Set `strictConnectionProcessing: true` in proxy configurations to strip hop-by-hop headers declared in `Connection` headers and reject malformed formatting that could cause request desynchronization.

16. **Load Secrets Securely from Environment Bindings**

Avoid hardcoding plaintext credentials or static secrets in source code. Load them securely from environment variables using `env` from `hono/adapter` or retrieve platform secrets strictly via `c.env` on the request context.

17. **Configure Strict CORS, Timing Allowlists, and Middleware Combinators**

Restrict cross-origin timing access by passing an explicit origin validation callback to the `timing` middleware rather than using `crossOrigin: true`. Explicitly specify allowed headers in `cors` configuration, and compose multi-layered access controls using `every()` or `some()` combinators to guarantee fail-closed sequential execution.
