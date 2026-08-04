# Security blueprint

Repository: `https://github.com/vapor/vapor#4.122.0`

## Security posture

When developing applications with Vapor, developers must assume full responsibility for input validation, route-level authorization, and cryptographic integrity across all endpoints. While the framework provides robust primitives for session handling, cryptography, and templating, it does not enforce security boundaries by default. Security-sensitive surfaces include authentication flows, static file serving, and request payload parsing, where configuration mistakes must always fail closed.

## Essential implementation rules

1. **Enforce Explicit Authorization Middleware on Protected Routes**

Implement `AsyncMiddleware` to inspect `request.auth` and throw an `Abort(.unauthorized)` or `Abort(.forbidden)` error if the user lacks required privileges. Attach this middleware to route groups to prevent unauthorized execution of downstream handlers.

2. **Access Request-Bound Services Safely Within Handlers**

Always use request-bound services such as `req.client` inside route closures to ensure requests are handled on the correct SwiftNIO event loop. Avoid resolving global application instances inside route handlers to prevent thread-safety issues.

3. **Verify JWT Token Expiration and Claims**

Execute claim verification logic inside custom JWT payloads by calling `verifyNotExpired()` on `ExpirationClaim` or verifying audience and not-before claims.

4. **Generate Cryptographically Secure Tokens and Keys**

Utilize `[UInt8].random(count:)` with sufficient entropy and encode resulting bytes using Base64 for token generation, or instantiate `SymmetricKey` securely for cryptographic operations.

5. **Hash and Verify Passwords Securely Using Bcrypt**

Hash every user-supplied password using `Bcrypt.hash` before persisting it, and authenticate by verifying supplied passwords against stored hashes using `Bcrypt.verify`.

6. **Configure SameSite Session Cookies and Destroy Sessions on Logout**

Set `app.sessions.configuration.cookieFactory` to explicitly define `sameSite: .lax` or `sameSite: .strict` alongside `isSecure` and `httpOnly` flags, and call `req.session.destroy()` during logout to clear backend records and client cookies.

7. **Restrict FileMiddleware to Dedicated Static Folders**

Ensure that `FileMiddleware` points to a dedicated folder such as `app.directory.publicDirectory` instead of broader source paths to prevent unauthorized access to sensitive application code and credentials.

8. **Validate Incoming Request Content and Query Parameters**

Conform request payload models to `Validatable`, configure field validation rules inside `validations(_:)`, and explicitly call `.assert()` on the resulting `ValidationsResult` before processing.

9. **Inspect Media Type Parameters Explicitly for Encoding Safety**

Verify required parameters such as `charset` explicitly from the `parameters` dictionary when making security decisions based on content type attributes.

10. **Use Typed Constants for Case-Insensitive Header Matching**

Access headers through `HTTPHeaders` using predefined `HTTPHeaders.Name` constants or standard string literal indexing to enforce RFC-compliant case-insensitive header matching.

11. **Enforce TLS for Authentication Transports**

Never transmit or accept Basic authentication credentials over plaintext connections; ensure HTTPS and TLS are strictly enforced at the network boundary or via reverse proxy configuration.

12. **Render Dynamic Views Securely Using Encodable Contexts**

Pass untrusted user data through structured `Encodable` context types and rely on template auto-escaping mechanisms such as Leaf's variable interpolation instead of raw string concatenation.

13. **Enforce Explicit Body Collection and Decompression Limits**

Specify explicit byte limits using `body: .collect(maxSize:)` on routes and enforce strict uncompressed limits using `app.http.server.configuration.requestDecompression` to prevent resource exhaustion.

14. **Configure Production Error Middleware with Application Environment**

Pass `app.environment` into `ErrorMiddleware.default(environment:)` during server bootstrap to ensure internal implementation details and stack traces are hidden in production.

15. **Load Sensitive Credentials Securely from Environment Variables**

Fetch sensitive credentials dynamically using `Environment.get` or Vapor's `Environment.secret(path:)` helper instead of hardcoding secrets in source code or configuration files.

16. **Position CORS Middleware Before Error Handling**

Register `CORSMiddleware` at the beginning of the responder chain using `.beginning` to guarantee that error responses retain necessary CORS headers for cross-origin clients.
