# Security blueprint

Repository: `https://github.com/actix/actix-web#web-v4.14.0`

## Security posture

When developing applications with Actix-web, developers must assume responsibility for request routing order, input boundary enforcement, and safe error propagation to prevent security bypasses and information leakage. The framework provides default protections for HTTP/1.1 framing validation and basic content typing, but relies on explicit configuration for payload sizing, security headers, authentication middleware ordering, and static file path sandboxing. All security-sensitive boundaries, including authentication wrappers, route-level guards, proxy headers, and resource limits, must be configured securely and fail closed.

## Essential implementation rules

1. **Enforce Route-Level Guards and Correct Middleware Order**

Attach custom guard functions and authorization middleware using `guard = "..."` and `.wrap()` to filter requests before reaching handlers. Register security middleware in reverse order via `.wrap()` so outermost security checks execute first, and specify endpoint handlers using `Route::to()` or `Route::service()` before chaining wrappers.

2. **Use Named Structs for Query Extraction**

Define named structs derived with `Deserialize` for `web::Query<T>` extraction rather than ordered tuples to prevent panic conditions caused by unordered URL query parameters.

3. **Sanitize Error Responses and Propagate Startup Failures**

Implement explicit `ResponseError` traits or `ErrorHandlers` middleware to replace raw stack traces and diagnostic details with sanitized JSON payloads. Ensure asynchronous state factories return explicit error variants so application startup fails fast on missing dependencies.

4. **Order Route Registrations and Restrict Dynamic Path Segments**

Register specific application routes and API services before mounting broader prefix matching or catch-all static file services to prevent handler shadowing. Restrict custom dynamic segment patterns with regular expressions that explicitly forbid slash characters to avoid path traversal.

5. **Restrict SHA-1 Hashing to WebSocket Handshakes**

Use the `hash_key` function strictly for RFC 6455 WebSocket handshake challenge-response generation and never for general-purpose cryptographic security or credential hashing.

6. **Enforce Content-Type Validation and Strict Multipart Limits**

Rely on `ClientResponse::json()` to enforce automatic `application/json` Content-Type verification and payload size boundaries. Apply `#[multipart(deny_unknown_fields, duplicate_field = "deny")]` and byte limits to guard form uploads against parameter pollution and memory exhaustion.

7. **Avoid Unencrypted Transport and Experimental Production Features**

Omit the `dangerous-h2c` feature flag in production deployments to prevent wrapping unencrypted TCP streams as mock TLS connections, and disable experimental-introspection reports.

8. **Isolate Static File Serving and Validate Paths**

Mount static file services against dedicated asset directories rather than broad root paths, keep hidden file serving disabled, and use `.path_filter()` to block symlink traversal.

9. **Differentiate Raw and Decoded Cookie and Match Information**

Use raw cookie retrieval methods like `cookie_raw()` when validating cryptographic HMAC signatures or exact byte sequences that should not be percent-decoded. Explicitly validate and decode `req.match_info()` parameters before using them in file access or routing logic.

10. **Configure Global and Error-Level Security Headers**

Attach standard HTTP security headers globally across apps and scopes using `DefaultHeaders` middleware, and ensure custom error handlers explicitly inspect and set mandatory security headers on returned error responses.

11. **Rely on Built-in Framing Validation and Secure Tunneling**

Rely on Actix Web's built-in header validation to reject malformed framing, maintain native HTTP/2 framing without manually injecting transfer-encoding headers, and ensure raw socket tunnels are negotiated over HTTP/1.1.

12. **Verify Direct Peer IP Addresses for Access Control**

Use `req.peer_addr()` instead of `req.connection_info()` for IP-based authorization and rate limiting unless trusted reverse proxy settings are explicitly verified, as upstream forwarding headers can be spoofed.

13. **Encode Dynamic Output and Set Explicit Content Types**

Explicitly set attachment dispositions or non-executable content types when serving user files, use structured builders or strict MIME types for non-HTML payloads, and strictly HTML-encode user input when overriding content types to HTML.

14. **Bound Server Timeouts, Connections, and Payload Sizes**

Configure explicit request timeouts, connection limits, and handshake rates on `HttpServer` and `awc::Connector` to prevent slow client exhaustion. Use `web::PayloadConfig`, `MultipartFormConfig`, and WebSocket frame size limits to bound memory consumption.

15. **Redact Sensitive Headers from Logs and Invalidate Sessions Securely**

Avoid invoking Debug formatting on request instances containing credentials, and sanitize logger format strings using custom request replacements. Invalidate client-side sessions by constructing removal cookies with matching attributes and invoking `add_removal_cookie`.
