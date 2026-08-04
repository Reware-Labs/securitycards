# Security blueprint

Repository: `https://github.com/beego/beego#v2.3.10`

## Security posture

When developing applications with Beego, developers must assume that security controls, request sanitization, and input validations must be explicitly configured and enforced. While the framework provides foundational filters, routing constraints, and ORM primitives, failure to properly secure configurations, sessions, and inputs leaves the application vulnerable. Developers must fail closed on missing authentications, unauthorized route access, and invalid input signatures.

## Essential implementation rules

1. **Configure Explicit CORS Origins and Avoid Global Wildcards with Credentials**

When setting up `cors.Options` via `beego.InsertFilter`, avoid using wildcard configurations alongside `AllowCredentials: true`. Explicitly list trusted domains in `AllowOrigins` to prevent unauthorized cross-origin entities from making authenticated requests and reading protected response data.

2. **Enforce Authorization Filters and Policy Middleware Before Route Handlers**

Register authorization filters and policy middleware at the `web.BeforeRouter` stage to evaluate access policies before controller handlers run, returning HTTP `403 Forbidden` for unauthorized requests. Always write an HTTP response status or body within custom policy functions whenever access control checks fail.

3. **Call Context-Aware Execution Methods Directly on Queries**

Do not rely on deprecated context table constructors because passed context parameters are ignored. Instead, call context-aware execution methods directly on the resulting query setters or query mergers such as `AllWithCtx`, `OneWithCtx`, `InsertWithCtx`, or `UpdateWithCtx`.

4. **Verify API Request Signatures and Client Timestamps Using Shared Secrets**

When protecting endpoints with API secret authentication or verifying request signatures manually, ensure all core request context components are explicitly supplied. Configure an appropriate timeout threshold to prevent replay attacks.

5. **Restrict Configuration Sources to Trusted Local Files**

Prevent untrusted user-supplied buffers or streams from being parsed by configuration loaders, as automatic environment variable expansion can expose system environment variables. Load configuration files strictly from trusted paths using `config.NewConfig`.

6. **Use Secure Random Generation and Cryptographic Key Lengths for Cookies**

Supply cryptographically generated random keys matching standard AES key sizes like 16, 24, or 32 bytes when encoding or decoding session cookies using AES block ciphers.

7. **Implement Synchronizer Token Validation for State-Changing Requests**

Configure `EnableXSRF` on `WebConfig` or ensure it remains enabled on custom controllers handling state-changing methods. Call `XSRFToken` beforehand to generate and load the token into context, and invoke validation functions during request processing.

8. **Register Custom Types Before Gob Deserialization**

Because session providers in Beego serialize and deserialize values using `gob` encoding, any custom struct types saved into the session must be registered with `gob.Register` during application initialization to prevent decoding errors.

9. **Validate and Sanitize File Paths to Prevent Path Traversal**

Never use untrusted multipart file header filenames directly to build disk paths when processing uploads. Sanitize filenames using `filepath.Base` or generate isolated filenames before saving. Ensure resolved file paths for downloads remain strictly within intended storage boundaries.

10. **Use Parameterized Queries in ORM and QueryBuilders**

When executing raw database queries or constructing queries with query builders, supply variable inputs using parameter placeholders such as `?` rather than formatting or concatenating untrusted input strings directly into the SQL query.

11. **Validate Untrusted Struct Inputs Using Validation Rules**

Use Beego's validation package to apply validation struct tags and check return values from `valid.Valid` or `valid.HasErrors()`, halting execution if validation fails. Use `v.RecursiveValid()` when handling nested struct fields, and set `RequiredFirst: true` for optional fields.

12. **Constrain Route Parameters with Route Expressions**

Define the accepted format in the route using `:param(reg)` or built-in constraints such as `:id:int`. Beego only invokes the handler when the path value matches the route expression.

13. **Maintain HTML Escaping in HTTP Settings and JSON Serialization**

Use Beego’s built-in `htmlquote` template function when a value requires HTML escaping. Do not use `str2html` for such values because it converts a string to HTML without escaping it.

14. **Configure Explicit Request Body Size Limits**

Set strict size bounds using `MaxMemory` and `MaxUploadSize` configurations to prevent excessive heap allocation or disk utilization caused by unbounded request bodies.

15. **Configure Production RunMode and Disable Debug Settings**

Configure `web.BConfig.RunMode` to `prod`, set `web.BConfig.EnableErrorsShow` and `web.BConfig.EnableErrorsRender` to `false`, and ensure `orm.Debug` is set to `false` to avoid exposing stack traces, internal errors, and full SQL statements.

16. **Load Credentials and Secrets Securely from Environment Variables**

Always retrieve credentials such as database DSNs, API keys, passwords, and signing keys via environment variables or secret management services when initializing providers or logging targets.

17. **Halt Request Processing in Security Filters Using ReturnOnOutput**

When registering security filters via `InsertFilter`, pass `WithReturnOnOutput(true)` to ensure request processing halts immediately when the filter writes a response body or error status code.

18. **Configure Secure Cookie Attributes and Explicit Cryptographic Keys**

Explicitly set static secret keys such as `securityKey` and `blockKey` when initializing session providers to prevent transient random keys on startup. Ensure `secure` or `CfgSecure` is enabled in production environments to restrict cookies to HTTPS channels.

19. **Propagate Request Context and Promptly Release Session Resources**

Always invoke `SessionRelease` with the active HTTP request context immediately after acquiring a session via `SessionStart` to ensure session persistence and network operations respect request cancellation.

20. **Regenerate Session Identifiers and Invalidate Tokens on Logout**

Invoke session regeneration functions such as `SessionRegenerateID` immediately after authenticating a user to prevent session fixation attacks. Always invoke `SessionDestroy` when handling user logouts.
