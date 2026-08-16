# Security blueprint

Repository: `https://github.com/django/django#6.0.7`

## Security posture

Developers working with Django must assume a defense-in-depth posture where framework defaults protect against common web vulnerabilities like CSRF, SQL injection, and XSS when configured correctly. The framework does not automatically enforce authentication, authorization, or secure environment boundaries, meaning missing decorators or permissive routing will fail open. Critical attack surfaces include user-facing form inputs, database queries, authentication and session management pipelines, and reverse proxy integrations. All state-changing operations, sensitive configurations, and cryptographic operations must adhere to strict validation and hardening standards to prevent unauthorized access and data leakage.

## Essential implementation rules

1. **Enforce Strict View-Level Authorization Checks**

Protect function-based and class-based views by utilizing decorators such as `permission_required` with an iterable of codenames and `raise_exception=True`, or class-based mixins like `LoginRequiredMixin` and `PermissionRequiredMixin`. Ensure administrative form choices are filtered against `request.user` to prevent unauthorized tenant data access.

2. **Configure Secure Authentication and Password Hashing**

Pass verified user instances explicitly to `login()` or `alogin()`, enforce strict expiration times via `PASSWORD_RESET_TIMEOUT`, and hash passwords using robust algorithms listed at the beginning of `PASSWORD_HASHERS` such as `Argon2PasswordHasher` or `ScryptPasswordHasher`. Always use `check_password` with a setter callback to automatically upgrade legacy password hashes.

3. **Harden Boundary Controls and Proxy Settings**

Only enable `SECURE_PROXY_SSL_HEADER` when running behind a trusted reverse proxy that strips incoming header values from untrusted clients. Define `ALLOWED_HOSTS` strictly and retrieve request domains via `HttpRequest.get_host()` to mitigate Host header attacks.

4. **Sign and Cryptographically Verify Payloads Safely**

Namespace cryptographic signatures using unique `salt` parameters and enforce strict expiration limits via `max_age` during verification. Rely on built-in JSON-based serialization for sessions and signed objects to prevent arbitrary object deserialization risks.

5. **Maintain Global CSRF and Middleware Protections**

Keep `CsrfViewMiddleware` active in `MIDDLEWARE`, include `{% csrf_token %}` tags in HTML forms, and configure `CSRF_TRUSTED_ORIGINS` with full origins or subdomain wildcards. Ensure all security and authentication middleware components are ordered correctly in settings.

6. **Use Parameterized Queries and Structured Expressions**

Prevent SQL injection by using QuerySet parameterization or parameterized raw queries with explicit parameter bindings. Avoid string concatenation and do not pass untrusted user input directly as keyword arguments to database expression `Func()` wrappers.

7. **Validate and Clean Model and Form Inputs**

Explicitly call `full_clean()` on model instances before persistence, process HTTP inputs through form `cleaned_data`, and enforce strict character set and username formatting validators. Prohibit null characters in string inputs using `ProhibitNullCharactersValidator`.

8. **Ensure Robust URL Routing and Parameter Validation**

Explicitly anchor regular expression patterns in `re_path()` with start and end anchors, constrain route parameters using explicit typed path converters, and raise `ValueError` inside custom URL converters to trigger `404` routing decisions.

9. **Harden Interface Protocols and Response Headers**

Include `SecurityMiddleware`, `XFrameOptionsMiddleware`, and `ContentSecurityPolicyMiddleware` in the middleware stack. Configure HSTS, MIME-sniffing protection, referrer policies, and COOP headers securely in `settings.py`.

10. **Escape Untrusted Content and Construct Safe HTML**

Escape untrusted content using built-in filters and escaping utilities before rendering it into templates. When constructing dynamic HTML snippets in custom template tags or filters, use `format_html()` instead of manual string formatting with `mark_safe`.

11. **Mitigate Resource Exhaustion and Enforce Input Limits**

Specify `absolute_max` and `max_num` with `validate_max=True` when creating formsets from untrusted input to prevent memory exhaustion. Enforce strict length limits on user input fields across forms and request bodies.

12. **Secure Runtime Environment and Secret Management**

Set `DEBUG = False` and deploy applications using production-grade WSGI or ASGI servers rather than development servers. Load `SECRET_KEY`, fallback keys, and sensitive backend credentials securely from environment variables or secret managers.

13. **Redact Sensitive Data in Exception Reports and Logs**

Annotate sensitive view functions and internal callables with `@sensitive_post_parameters` and `@sensitive_variables` to prevent credentials and tokens from leaking into exception reports or stack trace logs, and use `SafeExceptionReporterFilter`.

14. **Manage Session Lifecycle and Secure Cookie Attributes**

Configure `SESSION_COOKIE_SECURE` and `SESSION_COOKIE_HTTPONLY` as boolean `True`. Cycle session keys upon authentication state changes using `request.session.cycle_key()`, flush session data completely on logout, and rotate session keys when updating user passwords.
