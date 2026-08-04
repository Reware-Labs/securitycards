# Security blueprint

Repository: `https://github.com/tokio-rs/axum#axum-v0.8.9`

## Security posture

When developing applications in Axum, developers must assume full responsibility for enforcing authentication, route-level authorization, and input validation. While the framework provides composable extractors, routing mechanics, and middleware layers, it does not enforce access control policies, rate limiting, or secure cookie configurations by default. Security-sensitive surfaces include custom extractors, parameter handling, and service boundaries, where parsing failures or incorrect ordering can lead to silent bypasses. All security controls, error sanitization, and request limits must fail closed to protect against resource exhaustion and unauthorized access.

## Essential implementation rules

1. **Enforce Route-Level Authorization and Short-Circuit Execution**

Implement custom middleware or extractors that short-circuit request execution immediately upon authorization failure, returning an error response like `StatusCode::UNAUTHORIZED` to prevent unauthorized requests from reaching downstream handlers.

2. **Position Body-Consuming Extractors as Final Handler Parameters**

Place body-consuming extractors such as `Json`, `Form`, `Multipart`, `Bytes`, `String`, or `RawBody` after all other parameters like `State`, `Path`, or `HeaderMap` in the handler signature to prevent stream exhaustion failures.

3. **Sanitize Extractor and Service Error Responses**

Return sanitized HTTP error responses and dedicated error types implementing `IntoResponse` rather than forwarding raw internal error details, trace strings, or unformatted exceptions to clients.

4. **Authenticate Requests via Custom Extractors and Middleware Extensions**

Implement `FromRequestParts` on custom types to extract and verify bearer tokens using validation libraries, mapping failures to unauthorized responses or storing validated user identities in request extensions.

5. **Apply Request-Modifying Middleware and Route Layers Correctly**

Wrap the complete Router service with request-modifying middleware instead of using `Router::layer`, and ensure all target routes are defined on the Router before applying `.layer()` to prevent security bypasses.

6. **Enforce Cryptographic Integrity on Cookies**

Extract and manage sensitive session tokens using `SignedCookieJar` or `PrivateCookieJar` instead of plain `CookieJar`, and explicitly configure restrictive security directives including `SameSite=Lax`, `HttpOnly`, and `Secure`.

7. **Validate and Destroy OAuth CSRF State Parameters**

Verify that incoming OAuth state parameters match server-stored CSRF tokens retrieved from session cookies, and immediately destroy the session token after validation to ensure single-use protection.

8. **Ensure Safe Zero-Copy JSON Deserialization with Cow**

Use `std::borrow::Cow` decorated with `#[serde(borrow)]` for fields that may contain escape sequences during zero-copy request parsing with `JsonDeserializer` to safely fall back to owned allocations.

9. **Enforce Domain Constraints via Validation Extractors**

Implement custom wrapper extractors using `FromRequest` to invoke domain validation libraries like `validator::Validate` on deserialized data, rejecting malformed input before application processing.

10. **Validate Percent-Decoded URL Path Parameters**

Prefer deserializing percent-decoded path parameters directly into strongly typed identifiers such as `Uuid` or integers instead of raw strings to prevent traversal sequences and alternate interpretations.

11. **Configure Restrictive CORS and Security Headers**

Restrict cross-origin resource sharing origins, methods, and headers explicitly using `CorsLayer`, and append systematic security response headers like `Content-Security-Policy` and `X-Content-Type-Options` using response mapping middleware.

12. **Sanitize Redirect Location Strings**

Validate user-supplied redirect paths against header-safe character sets to ensure inputs do not contain invalid control characters like newlines or carriage returns that cause server conversion errors.

13. **Restrict Network Interface Exposure When Binding Listeners**

Bind network listeners for `axum::serve` to loopback interfaces such as `127.0.0.1` or `[::1]` rather than wildcards when services should not be exposed externally.

14. **HTML-Escape Untrusted Input Before Rendering Responses**

Explicitly escape untrusted text using an HTML escaping library or secure templating engine prior to wrapping it in Axum's `Html` response type to prevent Cross-Site Scripting.

15. **Enforce Request Body and Concurrency Limits**

Restrict payload sizes using `DefaultBodyLimit::max` or `RequestBodyLimitLayer`, and combine them with concurrency limits and timeouts via `ServiceBuilder` to prevent memory and connection exhaustion.

16. **Load Cryptographic Secrets from Runtime Environment Variables**

Read sensitive tokens and cryptographic keys dynamically at startup using `std::env::var` for configuration values like `JWT_SECRET` or `COOKIE_SECRET_KEY`, and fail startup if required variables are missing.
