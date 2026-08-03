# Security blueprint

Repository: `https://github.com/Kludex/starlette#1.3.1`

## Security posture

The Starlette security model relies on secure middleware configuration, explicit route typing, and robust perimeter controls to protect web applications against common web vulnerabilities. While Starlette provides foundational infrastructure for routing, session management, and template autoescaping by default, developers must explicitly enforce authentication, authorization, strict CORS policies, and secure cookie attributes. Security-sensitive surfaces include endpoint routing, middleware pipelines, credential handling, and request streaming, where misconfigurations or unvalidated inputs should fail closed.

## Essential implementation rules

1. **Enforce Authentication Scopes and Hide Privileged Endpoints**

Apply the `@requires` decorator alongside `AuthenticationMiddleware` to verify user permissions and roles. Use `status_code=404` with `@requires` to prevent URL enumeration and hide privileged routes from unauthorized users.

2. **Configure Secure CORS Middleware Policies**

Avoid wildcard origins (`*`) alongside `allow_credentials=True`. When using `allow_origin_regex`, avoid broad wildcards like `.*` that match special characters and instead use strict character classes like `[a-zA-Z0-9-]+`. Ensure `allow_private_network` is set to `False` unless explicit internal network interaction is required.

3. **Cache Request Body Before Direct Stream Consumption**

Always await `request.body()` or `request.json()` to cache the body payload in memory before iterating over `request.stream()` to prevent runtime errors caused by draining the unbuffered ASGI receive channel.

4. **Sanitize Exception Handlers and Disable Production Debug Mode**

Explicitly set `debug=False` when configuring `ServerErrorMiddleware` or initializing the application to prevent internal paths and local variables from leaking. Register custom exception handlers via the `exception_handlers` dictionary parameter on the `Starlette` constructor to return sanitized error responses.

5. **Validate Credentials and Handle Errors in Custom Authentication Backends**

When subclassing `AuthenticationBackend`, ensure `authenticate()` returns a tuple of `(AuthCredentials, BaseUser)` upon success. Catch credential decoding exceptions gracefully and raise `AuthenticationError` rather than letting unhandled exceptions bubble up as 500 server errors.

6. **Enforce Configuration Mutability Control via Environ**

Use `starlette.config.environ` or `Environ` to read environment settings safely and prevent unauthorized environment variable modifications after application configuration has been evaluated.

7. **Set Secure and SameSite Attributes on Session Middleware**

Configure `SessionMiddleware` with `same_site='lax'` (or `'strict'`) and `https_only=True` to ensure session cookies are marked Secure and restricted from cross-site transmission, mitigating Cross-Site Request Forgery.

8. **Serve Files Securely Through StaticFiles Mounting**

Expose request-addressable files by mounting `StaticFiles` with a dedicated directory. `StaticFiles` automatically verifies that resolved paths remain within the configured directory and rejects absolute or traversal attempts with a 404 response.

9. **Use Typed Path Converters for Route Parameters**

Define URL route patterns using explicit type converters such as `{param:int}` or `{param:uuid}`. The router enforces these constraints during URL matching and automatically rejects malformed parameter types early with a 404 response.

10. **Rely on Proxy-Aware Middleware for Client IP Addresses**

When operating behind a reverse proxy, use proxy-aware middleware such as Uvicorn's `ProxyHeadersMiddleware` to correctly determine client IP addresses and protocol headers from `X-Forwarded-For` and `X-Forwarded-Proto` instead of depending on raw ASGI scope values.

11. **Ensure Autoescaping is Enabled in Template Engines**

Initialize `Jinja2Templates` with standard directory configurations so that Starlette enables automatic escaping by default for `.html`, `.htm`, and `.xml` templates, protecting against Cross-Site Scripting vulnerabilities.

12. **Limit Request Body, Field, and Form Parsing Sizes**

Pass explicit limits such as `max_files`, `max_fields`, and `max_part_size` to `request.form()` to protect application resources against memory and CPU exhaustion attacks.

13. **Protect Sensitive Credentials Using Secret Datastructures**

Load session secret keys and sensitive credentials into Starlette `Secret` datastructures from environment variables rather than hardcoding plaintext strings. Explicitly cast `Secret` instances to `str` only at the exact point of usage.

14. **Propagate Security Context Using Request State Across Middleware**

Rely on `request.state` rather than `contextvars` to reliably propagate security contexts, authentication states, and audit metadata across middleware boundaries and downstream endpoint handlers.
