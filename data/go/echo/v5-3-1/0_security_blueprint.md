# Security blueprint

Repository: `https://github.com/labstack/echo#v5.3.1`

## Security posture

The echo repository requires developers to explicitly configure security controls across routing, middleware, request binding, and error management surfaces. While the framework provides secure primitives for CORS, CSRF, rate-limiting, and headers, it does not enforce authentication context checks, input validation, or timeout limits by default. Developers must ensure that all security-sensitive routes fail closed, errors are sanitized, untrusted inputs are validated explicitly, and upstream proxies are strictly restricted against IP spoofing.

## Essential implementation rules

1. **Verify Authentication Context Explicitly**

Explicitly check whether the authentication context exists inside route handlers when using middleware configured with `ContinueOnIgnoredError: true` to prevent unauthenticated access. Always use `crypto/subtle.ConstantTimeCompare` inside custom validators for BasicAuth or KeyAuth to prevent side-channel timing attacks.

2. **Configure Redirect Status Codes and Path Rewriting Pre-Routing**

Supply valid HTTP status codes within the 300-308 range for redirect configurations and trailing slash handlers. Register URL rewrite and path normalization middleware using `e.Pre()` instead of `e.Use()` so that modifications occur before route resolution and associated authorization checks.

3. **Handle Errors, Response Commitments, and CORS Origins Safely**

Construct HTTP errors using `echo.NewHTTPError` or wrap underlying errors to preserve status codes while keeping client messages sanitized. Verify response commitment status via `echo.UnwrapResponse` before writing error responses in centralized handlers, and return `allowed=false` with a nil error when rejecting origins in `UnsafeAllowOriginFunc`.

4. **Enforce Strict Cryptographic Nonces and CSRF Protection**

Derive security nonces and tokens directly from `crypto/rand` using `io.ReadFull` without modulo bias. Configure CSRF protection explicitly with `CookieSecure: true`, `CookieHTTPOnly: true`, appropriate SameSite policies, and exact `TrustedOrigins` definitions.

5. **Secure Static Asset Delivery and Path Resolution**

Rely on Echo's built-in file path resolution and static middleware configuration without manually unescaping request URL paths to prevent path traversal variants. Ensure directory browsing remains disabled (`Browse: false`) in production environments.

6. **Validate Request Input and Enforce Input Contracts**

Implement the `echo.Validator` interface and explicitly call `c.Validate()` after binding request data, as Echo does not validate automatically during `c.Bind()`. Use typed parameter binding helpers and dedicated single-source binding functions to maintain strict parameter origin boundaries and prevent parameter overrides.

7. **Configure Secure CORS Origins and Normalize URL Paths**

Ensure allowed origins include explicit schemes and hostnames, utilizing `UnsafeAllowOriginFunc` for secure dynamic subdomain matching. Account for URL encoding variations in custom regex rewrite rules to prevent parser bypasses.

8. **Harden HTTP Interfaces, Security Headers, and Method Overrides**

Use `middleware.SecureWithConfig()` to set essential response headers such as CSP, HSTS, and X-Frame-Options. Restrict HTTP method overrides to POST requests using the `MethodOverride` middleware configured with `MethodFromHeader`.

9. **Prevent IP Spoofing and Resource Exhaustion**

Configure an explicit `e.IPExtractor` on the Echo instance before using proxy or remote IP functionality to prevent X-Forwarded-For spoofing. Protect against resource exhaustion by enforcing strict limits on request body sizes, decompressed payloads via `MaxDecompressedSize`, request timeouts, HTTP server timeouts, and rate limiters.

10. **Harden Runtime Environments and Redact Secrets from Logs**

Disable detailed error exposure in production by setting `exposeError` to false via `echo.DefaultHTTPErrorHandler(false)`, and register `middleware.Recover()` at the top of the stack to prevent process crashes. Sanitize and redact sensitive body payloads within `BodyDumpHandler` callbacks before logging or persisting them.
