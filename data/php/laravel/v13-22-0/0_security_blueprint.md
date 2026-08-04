# Security blueprint

Repository: `https://github.com/laravel/framework#v13.22.0`

## Security posture

Laravel applications rely on built-in middleware, query parameter binding, and request validation to secure core request flows by default, but developers must explicitly enforce authentication, authorization, and secure session parameters. The framework does not protect against improper configuration, missing access control checks, or unvalidated inputs. Sensitive boundaries include database interactions, routing endpoints, file handling, and session management, where failures should always fail closed.

## Essential implementation rules

1. **Configure explicit and restrictive CORS policies**

Define exact trusted domain names under `allowed_origins` in `config/cors.php` instead of wildcards or subdomain patterns, and scope CORS middleware strictly to API routes with limited methods and headers.

2. **Enforce route, controller, and form request authorization**

Attach authorization middleware to routes after binding substitution, call the `authorize()` method inside controllers, and implement the `authorize()` method in every custom Form Request to prevent access control bypasses.

3. **Secure authentication, guard configuration, and credential verification**

Enable token hashing in guard configurations, use constant-time `hash_equals()` comparisons for tokens, maintain equal execution time bounds using `Timebox` to prevent user enumeration, and ensure secure password hashing via `Hash::make()`.

4. **Manage session lifecycle states and secure cookie parameters**

Regenerate session identifiers upon authentication using `$request->session()->regenerate()`, invalidate sessions and rotate remember tokens on logout, enforce secure and HttpOnly flags on session cookies, and encrypt session payloads at rest.

5. **Configure CSRF protection and token validation**

Include CSRF verification fields via `csrf_field()` in state-changing HTML forms, configure SameSite attributes on session cookies, and restrict CSRF exceptions exclusively to verified external stateless endpoints.

6. **Validate incoming HTTP Host headers and proxy trust boundaries**

Configure `Middleware::trustHosts()` to validate incoming `Host` request headers against expected domain patterns, and explicitly define trusted proxy IP addresses and necessary forwarded headers in `Middleware::trustProxies()`.

7. **Enforce strict input validation and obtain data via validated methods**

Obtain request data exclusively via `$validator->validated()` or `$request->validate()` to drop unvalidated attributes and prevent mass assignment. Use array formats for validation rules containing regular expressions with pipe characters.

8. **Prevent SQL injection through query builder parameter binding**

Use standard Query Builder methods for parameter binding instead of passing user input directly into raw SQL expressions such as `DB::raw()` or `Illuminate\Database\Query\Expression`.

9. **Canonicalize and validate route parameters and file uploads**

Constrain and validate percent-encoded route parameters using the `where()` method before using them in filesystem operations, and apply explicit validation rules such as `file`, `mimes`, `max`, and `dimensions` to uploaded files.

10. **Secure static file storage, access control, and delivery**

Restrict direct public access to sensitive static files by storing them with private visibility or serving temporary signed URLs via `Storage::temporaryUrl()`. Use randomized hashes with `Storage::putFile()` for user-provided files.

11. **Disable unserialization during decryption for non-object payloads**

Explicitly pass `unserialize: false` or utilize `decryptString()` when decrypting raw strings or non-object values to prevent PHP `unserialize()` from automatically processing payloads into instantiated objects.

12. **Configure multi-tiered rate limits and resource throttling**

Combine per-second and per-minute rate limits using `RateLimiter::for` attached to sensitive routes via `ThrottleRequests`, and maintain strict throttling and lifespan limits on token repositories.

13. **Disable debug mode and enforce production environment hardening**

Set `APP_ENV` to `production` and `APP_DEBUG` to `false` in production deployment environments to prevent stack trace and internal path leakage, and store environment files outside the web root.

14. **Protect sensitive parameters, credentials, and secrets from logging**

Decorate parameters containing plain-text credentials or tokens with the `#[\SensitiveParameter]` attribute, and exclude sensitive inputs using `dontFlash` on the exception handler to prevent raw secrets from persisting in sessions or logs.

15. **Maintain correct HTTP middleware priority order and security control integrity**

Ensure cookie encryption, session initialization, and request authentication execute before route authorization in the middleware priority stack, and avoid globally disabling security middleware during testing.
