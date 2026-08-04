# Security blueprint

Repository: `https://github.com/fastapi/fastapi#0.139.2`

## Security posture

FastAPI applications rely on Pydantic, Starlette, and ASGI middleware to handle routing, request validation, serialization, and lifecycle management securely. While the framework automates input parsing, serialization, and OpenAPI documentation generation, developers must explicitly enforce authentication, authorization scopes, strict content types, CORS policies, and secure session management. Security-sensitive boundaries include request parameter parsing, file uploads, endpoint dependencies, and error handling, where improper configuration or missing validation must fail closed.

## Essential implementation rules

1. **Configure Explicit CORS Policies with Credentials**

When configuring `CORSMiddleware` with `allow_credentials=True`, explicitly specify allowed origins, methods, and headers instead of using wildcards. Use `expose_headers` to expose custom response headers to browser clients.

2. **Enforce Scopes and Ownership in Dependencies**

Declare endpoint scope requirements using `Security` and `SecurityScopes` to inspect the token dependency tree. Return `403 Forbidden` exceptions for unauthorized resource operations.

3. **Use Dedicated Response Models for Serialization**

Define dedicated Pydantic models for response serialization rather than relying on runtime exclusion parameters like `response_model_exclude` to ensure accurate OpenAPI documentation and prevent sensitive data exposure.

4. **Verify Passwords and Tokens Securely**

Use modern memory-hard hashing algorithms like Argon2 via `pwdlib` and evaluate dummy password hashes during failed user lookups to prevent timing attacks. Compare sensitive credential strings using `secrets.compare_digest`.

5. **Secure File Uploads and Resource Cleanup**

Use `UploadFile` instead of raw bytes or `bytes` parameters to buffer large payloads to spooled temporary files and prevent memory exhaustion. Ensure `python-multipart` is installed and rely on FastAPI's middleware stack for resource cleanup.

6. **Enforce Strict Input and Parameter Validation**

Declare explicit type annotations, Pydantic models, and validation constraints using `Path()` and `Query()` across all request parameters. Configure form and cookie models with `model_config = ConfigDict(extra='forbid')` and specify explicit element types for list query parameters.

7. **Enforce Strict Content Type Checking**

Keep `strict_content_type` enabled to prevent FastAPI from parsing JSON bodies when the `Content-Type` header is missing or non-JSON, avoiding content-type confusion and unintentional request interpretation.

8. **Include WWW-Authenticate Header on Authentication Failures**

Include the `WWW-Authenticate` header set to `Bearer` when raising HTTP `401 Unauthorized` exceptions in OAuth2 token authentication dependencies.

9. **Sanitize JSON Embedded in HTML Script Tags**

Pass custom configuration parameters directly through `swagger_ui_parameters` in `get_swagger_ui_html()` so that values are safely converted using the internal HTML-safe JSON encoder.

10. **Enforce Body Size Limits and Pagination Bounds**

Register custom ASGI middleware to count received body bytes and reject requests exceeding content size limits. Prevent database resource exhaustion by bounding query pagination parameters using `Query` with `le` constraints.

11. **Harden Runtime Environment and Disable Debug Mode**

Explicitly set `debug=False` when instantiating `FastAPI` in production configurations to prevent leaking internal tracebacks, and use the `fastapi run` command instead of development server modes.

12. **Load Secret Keys and Configuration Securely**

Provide sensitive settings, API tokens, and secret keys through environment variables read at runtime rather than storing them in application code or source control.

13. **Order Middleware Correctly for Security Boundaries**

Register outermost security controls, such as CORS, rate limiters, or logging middleware, last so they wrap inner middleware layers and execute first on incoming requests.

14. **Enforce Session Expiration and Cookie Security**

Explicitly set expiration claims on JWT bearer session tokens using `datetime.now(timezone.utc)` and a defined `timedelta`. Use `APIKeyCookie` to require named cookie credentials for protected endpoints.
