# Security blueprint

Repository: `https://github.com/dotnet/aspnetcore#v10.0.10`

## Security posture

The ASP.NET framework provides robust primitives for authentication, authorization, cryptography, and request validation, but requires explicit configuration to secure edge behavior and session handling. Developers must enforce strict global policies, validate incoming tokens and inputs at boundaries, and protect sensitive data in transit and at rest. Mistakes in configuration, missing anti-forgery tokens, or bypassed authorization checks should always fail closed to prevent unauthorized access and remote compromise.

## Essential implementation rules

1. **Enforce Global Authorization Fallbacks and Pipeline Ordering**

Configure `AuthorizationOptions.FallbackPolicy` to enforce baseline authentication across all unmapped and unannotated requests. Ensure `UseAuthorization()` is placed strictly after `UseRouting()` in the request pipeline so that endpoint metadata attributes are properly evaluated.

2. **Validate JWT Bearer and WS-Federation Tokens with HTTPS Metadata**

Set `JwtBearerOptions.Authority` and expected audiences while maintaining `RequireHttpsMetadata = true` in non-development environments. Enforce state correlation token validation and require strict client certificate validation modes on Kestrel endpoints when using mutual TLS.

3. **Configure Secure Cookie Options and Server-Side Session Validation**

Enforce `CookieSecurePolicy.Always`, `HttpOnly = true`, and appropriate `SameSite` settings on all authentication cookies. Validate user security stamps during session evaluation to immediately invalidate revoked sessions and protect expiration time spans.

4. **Apply Strict Input Validation and Mass Assignment Protections**

Annotate DTOs and action parameters with validation attributes like `[Required]` and `[BindRequired]`, and always verify `ModelState.IsValid` before business logic execution. Protect sensitive model properties against over-posting using `[BindNever]` or dedicated input DTOs, and disable empty body model binding defaults.

5. **Secure Data Protection Algorithms and Secret Management**

Use approved cryptographic algorithms via `UseCryptographicAlgorithms` and wrap sensitive token parsing and key derivation buffers in `try-finally` blocks that explicitly clear memory via `Span<byte>.Clear()`. Load credentials and signing keys dynamically from secure configuration providers rather than source code.

6. **HTML Encode Untrusted Output and Restrict Logging Telemetry**

Always use `HtmlEncoder.Default.Encode()` or built-in view engines to encode untrusted user input before rendering manual HTML responses. Set production log levels to `Warning` or higher and rely on built-in HTTP logging redaction to keep credentials and tokens out of logs.

7. **Secure Inter-Component Communication and IPC Endpoints**

Secure Windows named-pipe endpoints on Kestrel with explicit ACLs and `CurrentUserOnly = true`. Restrict access token extraction from query strings strictly to WebSockets or Server-Sent Events with explicit path checks, and enforce application buffer limits to prevent resource exhaustion.

8. **Prevent Cross-Site Request Forgery and Unsafe Deserialization**

Protect OpenID Connect request state parameters and authentication callbacks using standard Data Protection-backed formatting. Ensure custom state data formats and WS-Federation handlers validate correlation tokens and reject unsolicited logins to prevent CSRF and object deserialization vulnerabilities.
