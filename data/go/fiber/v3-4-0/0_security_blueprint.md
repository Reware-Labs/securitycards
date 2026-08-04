# Security blueprint

Repository: `https://github.com/gofiber/fiber#v3.4.0`

## Security posture

When developing applications with Fiber, developers must assume responsibility for request validation, boundary control, and secure middleware ordering. The framework handles basic HTTP routing and pooling primitives by default, but does not enforce authentication, strict parameter binding origins, or automated output sanitization without explicit configuration. Security-sensitive surfaces include middleware chains, request binding methods, dynamic redirects, and session management where misconfigurations can lead to unauthorized access, resource exhaustion, or data leakage.

## Essential implementation rules

1. **Enforce Early Return and Middleware Ordering**

Abort middleware execution immediately upon authorization failure without calling `c.Next()`. Register core security middleware such as `cors.New()` and `helmet.New()` globally before defining routes, and place `encryptcookie` prior to any downstream cookie-reading middleware.

2. **Secure Authentication and Credential Verification**

Provide non-nil Validator functions and use `subtle.ConstantTimeCompare` for API keys in `keyauth.New`, and configure `basicauth.New` with bcrypt password hashes. Avoid extracting sensitive credentials from URL query parameters.

3. **Validate Request Input and Handle Binding Errors**

Explicitly return errors from binding methods and inspect `*fiber.BindError` to safely extract fields without leaking internal backend traces. Declare required struct tags on binding models, configure a `StructValidator` on the Fiber app instance, and avoid using `b.All()` when parameter values must come from a designated source.

4. **Configure CSRF Protection and Secure Session Management**

Set secure cookie attributes (`CookieSecure`, `CookieHTTPOnly`, `CookieSameSite`, `CookieSessionOnly`), enable `SingleUseToken` and idle/absolute timeouts, and call `sess.Regenerate()` immediately upon successful user authentication. Keep CSRF value redaction enabled in production (`DisableValueRedaction: false`) and avoid manually releasing session instances.

5. **Control Network Boundaries, Proxies, and TLS**

Explicitly configure trusted proxy IP addresses and header settings using `TrustProxyConfig.Proxies`, validate incoming Host headers with `hostauthorization`, and avoid mixing AutoCertManager with manual certificate files in `ListenConfig`.

6. **Prevent Resource Exhaustion and Handle Payload Limits**

Configure an explicit `BodyLimit` in `fiber.Config` to restrict incoming request payload sizes, enforce request deadlines using context timeouts, enable response body streaming for large client payloads, and assign a shared backend storage for multi-process rate limiting.

7. **Sanitize File Paths and Dynamic Parameters**

Verify that user-influenced file paths remain inside authorized base directories using `filepath.Clean()` and prefix checks. Restrict dynamic sort parameters using an explicit allowlist in pagination configuration, and URL-encode untrusted query parameters manually when configuring redirects.

8. **Enforce Interface Protocols and Secure Redirections**

Enable `GETOnly` mode on read-only services and restrict state modifications to unsafe HTTP methods. Validate untrusted redirect targets to relative paths before calling redirect methods, pass a safe internal fallback URL to `c.Redirect().Back()`, and avoid flashing sensitive form inputs via `c.Redirect().WithInput()`.

9. **Ensure Memory Safety in Asynchronous Contexts**

Avoid passing pooled `fiber.Ctx` instances or raw header slices directly into background goroutines. Obtain a standalone Go context using `c.Context()` or explicitly copy references before retaining them outside the request handler lifecycle.
