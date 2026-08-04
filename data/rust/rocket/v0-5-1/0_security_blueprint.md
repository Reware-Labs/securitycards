# Security blueprint

Repository: `https://github.com/rwf2/Rocket#v0.5.1`

## Security posture

Rocket applications rely on compile-time macro routing, typed request guards, and structured configuration to enforce security boundaries by default. Developers must explicitly manage session cryptography, input validation limits, and authorization checks, as the framework does not automatically protect against logic bypasses, CSRF on method-overridden routes, or path traversal. All untrusted inputs, external URIs, and database parameters must fail closed through rigorous typing, parameterized queries, and strict boundary validations.

## Essential implementation rules

1. **Enforce Authorization and Route Access with Request Guards**

Implement `FromRequest` to return explicit error outcomes such as `Outcome::Error((Status::Forbidden, ()))` on authorization failure rather than `Outcome::Forward`, and use request guards instead of fairings for route-level access control.

2. **Configure Secure CORS Headers and Handle Preflight Options**

Attach an `AdHoc::on_response` fairing or custom response fairing to validate incoming `Origin` headers against an explicit allowlist, set `Access-Control-Allow-*` headers with `Vary: Origin`, and map unhandled `OPTIONS` preflight requests returning `Status::NotFound` to `Status::Ok`.

3. **Inspect Pending Cookie Changes and Use Private Encrypted Cookies**

Use `CookieJar::get_pending()` to observe uncommitted cookie mutations during the current request lifecycle, store sensitive session identifiers exclusively in private encrypted cookies via `add_private()` and `get_private()`, and match original path and domain attributes when removing cookies.

4. **Authenticate Clients via mTLS and Verify Leaf Certificates**

Enable the `mtls` dependency feature and configure `Rocket.toml` with trusted CA certificates and `mandatory = true`. Use `rocket::mtls::Certificate` guards to validate peer certificate chains and inspect leaf certificate attributes before authorization.

5. **Harden Network Boundaries and Disable Untrusted IP Headers**

Set `ip_header = false` in release configurations unless the application sits strictly behind a trusted reverse proxy that strips incoming client-supplied IP headers to prevent IP spoofing.

6. **Ensure Secret Key Entropy and Trusted Configuration Sources**

Configure an explicit high-entropy 256-bit `secret_key` in `Rocket.toml` or via `ROCKET_SECRET_KEY`, instantiate manual `SecretKey` values from secure random byte slices of at least 64 bytes, and set the `workers` parameter solely through trusted Figment sources.

7. **Enforce Strict CSRF Controls on Method-Overridden Endpoints**

Maintain default `SameSite::Strict` cookie policies and apply explicit anti-CSRF tokens or origin validation to state-changing non-POST routes that handle HTTP method overrides via `_method` form fields.

8. **Exclude Structural Fields and Validate Bounds During Deserialization**

Annotate server-assigned primary keys and identity fields with `#[serde(skip_deserializing)]` on request body models, and validate HTTP status code bounds using `Status::from_code()`.

9. **Prevent Path Traversal and File Handling Vulnerabilities**

Use Rocket's `PathBuf` segment guard or `FileServer` with `relative!` path resolution to serve assets securely, validate dynamic path parameters with `FromParam`, and enforce file extension validation on `TempFile` uploads.

10. **Use Parameterized Queries with Database Pools**

Bind untrusted request parameters securely using query placeholders and parameter binding methods like `sqlx::query` with `.bind()` or compile-time macros like `sqlx::query!` rather than string formatting or concatenation.

11. **Enforce Field Validation and Strict URI Parsing**

Annotate form and query structs with `#[field(validate = ...)]` rules to restrict lengths and formats, and parse URIs using explicit target types such as `Uri::parse::<Origin>()`, `Absolute::parse`, and `Reference::parse` with subsequent normalization.

12. **Construct Redirects Securely Using the uri! Macro**

Construct internal redirect targets using the `uri!` macro or validate external destination URIs against a strict allowlist before passing them to `Redirect` constructors.

13. **Escape HTML Content in RawHtml Responses**

Explicitly encode untrusted user input using an HTML escaping library such as `html_escape::encode_text()` before wrapping string content in `rocket::response::content::RawHtml`.

14. **Configure Explicit Payload Data Limits and Capped Wrappers**

Define strict payload limits under `[default.limits]` in `Rocket.toml`, specify explicit byte limits when opening data streams via `Data::open()`, and validate truncation status using `Capped<T>`.

15. **Register Singleton Security Fairings and Middleware Correctly**

Attach singleton security fairings like `Shield` exactly once during application ignition, declare all implemented callback hooks in fairing info bitsets, and order middleware fairings sequentially.
