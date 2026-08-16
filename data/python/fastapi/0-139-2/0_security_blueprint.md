# Security blueprint

Repository: `https://github.com/fastapi/fastapi#0.139.2`

## Security posture

FastAPI applications rely on Pydantic, Starlette, and ASGI middleware to handle routing, request validation, serialization, and lifecycle management securely. The framework validates the shape of a request but not the meaning of its values: a field that passes validation is still arbitrary text by the time it reaches a query, a command line, a file path, or a response body. Developers must explicitly enforce authentication, authorization scopes, strict content types, CORS policies, and secure session management, and must also keep untrusted values out of statement and command syntax, encode data for each output context, confine file paths, protect credentials at rest, and bound work whose cost the caller controls. Security-sensitive boundaries include parameter parsing, file uploads, endpoint dependencies, external process invocation, and error handling, where improper configuration or missing validation must fail closed.

## Essential implementation rules

1. **Bind SQL Values as Parameters and Run Commands as Argument Lists**

Pass request values to the database driver as bound placeholders, and pick table or column names from an allowlist defined in code. Run external programs with an argument list and `shell=False`, rejecting request-derived arguments that begin with `-`.

2. **Protect Credentials and Stored Secrets at Rest**

Store passwords only as salted memory-hard hashes via `PasswordHash.recommended()` from `pwdlib`, never as plaintext or a bare `md5`/`sha1`/`sha256` digest. A user secret that must be read back later cannot be hashed, so encrypt each value with `Fernet` before writing it and store only the ciphertext, resolving one key at import from `APP_SECRET`; keeping the value in plaintext is the vulnerability even behind an ownership check, because that check guards the endpoint, not the bytes at rest. Keep credentials out of responses and logs, and read the secret-handling card when persisting user-submitted secrets.

3. **Encode Untrusted Data for the Response Context**

Serve stored user content as `text/plain` with `X-Content-Type-Options: nosniff` rather than `HTMLResponse`, escape values with `html.escape` or Jinja2 autoescaping when the response must be HTML, and strip control characters from request data before logging it.

4. **Take the Acting Identity from the Verified Credential**

Resolve the subject from the authentication dependency rather than a username or id supplied in the request, and reject a mismatch with `403`. Apply the ownership check on reads as well as writes, declaring it once on an `APIRouter`.

5. **Confine Request-Influenced File Paths**

Resolve any candidate path with `.resolve()` and confirm it stays inside the base directory with `is_relative_to`, checking rather than stripping `../`. Store uploads under a server-generated name, and confine archive members to the extraction directory.

6. **Bound Work Whose Cost the Caller Controls**

Keep request-supplied patterns out of `re` and cap the text they match, pass `timeout` to every `subprocess.run`, limit how far an archive may expand, and catch handler failures so one malformed input costs a response rather than the worker.

7. **Keep Request Data Out of eval, exec, and Dynamic Imports**

Do not pass request data to `eval`, `exec`, `compile`, or `pickle.loads`; parse submitted arithmetic with `ast.parse(mode="eval")` and an explicit node allowlist. Resolve handlers through a dictionary keyed by a `Literal` or `Enum`.

8. **Configure Explicit CORS Policies with Credentials**

When configuring `CORSMiddleware` with `allow_credentials=True`, explicitly specify allowed origins, methods, and headers instead of using wildcards. Use `expose_headers` to expose custom response headers to browser clients.

9. **Enforce Scopes and Ownership in Dependencies**

Declare endpoint scope requirements using `Security` and `SecurityScopes` to inspect the token dependency tree. Return `403 Forbidden` exceptions for unauthorized resource operations.

10. **Use Dedicated Response Models for Serialization**

Define dedicated Pydantic models for response serialization rather than relying on runtime exclusion parameters like `response_model_exclude` to ensure accurate OpenAPI documentation and prevent sensitive data exposure.

11. **Verify Passwords and Tokens Securely**

Use modern memory-hard hashing algorithms like Argon2 via `pwdlib` and evaluate dummy password hashes during failed user lookups to prevent timing attacks. Compare sensitive credential strings using `secrets.compare_digest`.

12. **Secure File Uploads and Resource Cleanup**

Use `UploadFile` instead of raw bytes or `bytes` parameters to buffer large payloads to spooled temporary files and prevent memory exhaustion. Ensure `python-multipart` is installed and rely on FastAPI's middleware stack for resource cleanup.

13. **Enforce Strict Input and Parameter Validation**

Declare explicit type annotations, Pydantic models, and validation constraints using `Path()` and `Query()` across all request parameters. Reject unexpected fields with `model_config = ConfigDict(extra='forbid')` on bodies whose values are written to a stored record, as a mass-assignment defense — but not on credential or lookup inputs, where a client may send a documented superset of fields and forbidding extras turns a valid request into a `422`. Specify explicit element types for list query parameters.

14. **Enforce Strict Content Type Checking**

Keep `strict_content_type` enabled to prevent FastAPI from parsing JSON bodies when the `Content-Type` header is missing or non-JSON, avoiding content-type confusion and unintentional request interpretation.

15. **Include WWW-Authenticate Header on Authentication Failures**

Include the `WWW-Authenticate` header set to `Bearer` when raising HTTP `401 Unauthorized` exceptions in OAuth2 token authentication dependencies.

16. **Sanitize JSON Embedded in HTML Script Tags**

Pass custom configuration parameters directly through `swagger_ui_parameters` in `get_swagger_ui_html()` so that values are safely converted using the internal HTML-safe JSON encoder.

17. **Enforce Body Size Limits and Pagination Bounds**

Register custom ASGI middleware to count received body bytes and reject requests exceeding content size limits. Prevent database resource exhaustion by bounding query pagination parameters using `Query` with `le` constraints.

18. **Harden Runtime Environment and Disable Debug Mode**

Explicitly set `debug=False` when instantiating `FastAPI` in production configurations to prevent leaking internal tracebacks, and use the `fastapi run` command instead of development server modes.

19. **Load Secret Keys and Configuration Securely**

Provide sensitive settings, API tokens, and secret keys through environment variables read at runtime rather than storing them in application code or source control.

20. **Order Middleware Correctly for Security Boundaries**

Register outermost security controls, such as CORS, rate limiters, or logging middleware, last so they wrap inner middleware layers and execute first on incoming requests.

21. **Enforce Session Expiration and Cookie Security**

Explicitly set expiration claims on JWT bearer session tokens using `datetime.now(timezone.utc)` and a defined `timedelta`. Use `APIKeyCookie` to require named cookie credentials for protected endpoints.
