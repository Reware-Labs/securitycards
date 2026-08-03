# Security blueprint

Repository: `https://github.com/salvo-rs/salvo#v0.94.0`

## Security posture

Salvo provides modular components and middleware for building robust web applications and APIs, but relies on developers to properly isolate sensitive routing surfaces, enforce strict CORS policies, and manage authentication state securely. While features like path normalization and OpenAPI validation help guard against malformed input, developers must explicitly configure security headers, bounded resource limits, and cryptographic secrets. Any gaps in middleware boundaries, secret management, or input validation should fail closed.

## Essential implementation rules

1. **Configure Explicit CORS Security Headers and Middleware Placement**

Avoid permissive CORS settings such as `Cors::permissive()` or `AllowOrigin::any()` on sensitive endpoints. Explicitly restrict origins, methods, headers, and credentials, and attach the CORS handler to the `Service` instance using `hoop()` rather than to individual routers so that browser preflight requests are handled properly.

2. **Verify Resource Ownership and Route Authorization**

Extract URL path parameters using `PathParam` and validate resource ownership against the authenticated user retrieved from Salvo's `Depot` before executing database transactions. Return a `FORBIDDEN` status code if authorization checks fail, and isolate public routes from protected sub-routers using distinct sibling structures and scoped `.hoop()` middleware.

3. **Handle Untrusted Redirects Safely and Halt Execution on Failure**

Use the fallible `Redirect::with_status_code` method instead of panicking convenience constructors like `Redirect::found` when processing untrusted or dynamic locations. In custom authentication middleware, always invoke `ctrl.skip_rest()` on the `FlowCtrl` parameter immediately after setting an unauthorized status to halt downstream handler execution.

4. **Enforce Strict Claims Validation and Secure Token Extraction**

When instantiating JWT decoders, use `ConstDecoder::with_validation` combined with an explicit `Validation` configuration to enforce expected claims like audience (`aud`) and issuer (`iss`). Restrict token extraction mechanisms to secure headers or cookies in production, avoiding query parameters to prevent exposure in logs and browser history.

5. **Load Cryptographic Secrets Securely and Hash Passwords with Argon2id**

Initialize cryptographic ciphers, session stores, and CSRF middleware using high-entropy random keys and secret bytes loaded from secure environment variables rather than hardcoded defaults. Always hash user passwords using memory-hard algorithms like Argon2id prior to database storage.

6. **Configure CSRF Protection and Secure Cookie Policies**

Enable the `csrf` feature flag and register session handlers in the router before the `Csrf` middleware. Explicitly enforce secure cookie attributes using `.secure(true)`—especially when deployed behind an upstream proxy terminating TLS—and configure appropriate rotation policies.

7. **Isolate File Storage and Sanitize User Paths**

Configure `DiskStore` uploads and `StaticDir` asset serving using dedicated absolute paths with restrictive file system permissions. Validate and sanitize all user-supplied upload identifiers and path components using `is_safe_upload_id` and `sanitize_path_component` to prevent traversal vulnerabilities, while keeping strict path normalization enabled on proxy configurations.

8. **Enforce Input Validation, Parameter Boundaries, and Body Limits**

Decorate request data transfer objects and endpoint annotations with OpenAPI validation attributes such as `min_length`, `max_length`, `pattern`, `minimum`, `maximum`, and collection item bounds to reject malformed input at compile and runtime. Restrict large payloads by applying `SecureMaxSize` middleware to specific resource routes.

9. **Harden Network Boundaries, Timeouts, and Proxy Settings**

Restrict transport negotiation to explicit ALPN protocols, configure server connection and request timeouts using `FuseConfig`, limit maximum concurrent connections on server acceptors, and use `TrustedProxyIssuer` with explicitly defined proxy IP addresses to prevent client IP spoofing.

10. **Encode Dynamic Data Safely Before HTML Rendering**

Avoid rendering unescaped dynamic variables directly into HTML responses via `Text::Html`. Place dynamic strings into an Askama template configured with HTML escape mode enabled, render the template safely, and pass the resulting sanitized string to `Text::Html` to prevent cross-site scripting.
