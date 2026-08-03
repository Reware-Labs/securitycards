# Security blueprint

Repository: `https://github.com/goadesign/goa#v3.28.0`

## Security posture

Developers working with Goa must treat service definitions, transport boundaries, and authentication handlers as security-sensitive surfaces. While Goa automatically validates payload structures and enforces transport routing constraints declared in the DSL, it does not validate cryptographic tokens, verify database record ownership, or enforce session security policies out of the box. All custom interceptors, authentication handlers, and outbound proxy integrations must fail closed and validate inputs strictly.

## Essential implementation rules

1. **Bypass Global Security Exclusively via Explicit NoSecurity DSL**

When global security requirements are declared at the API or Service level, management and health check endpoints inherit those rules by default. To allow unauthenticated probes to access endpoints without exposing sensitive credentials, explicitly call `NoSecurity()` within the health check `Method` expression.

2. **Enforce Record Ownership and Tenant Constraints on Data Access**

Always ensure that the authenticated user owns the requested record or belongs to the target tenant before allowing data modification or retrieval. Enforce explicit tenant and ownership checks in your service logic.

3. **Invoke Next Exactly Once in Goa Server Interceptors**

When writing Goa server interceptors, strictly invoke the next endpoint function exactly once to progress through the interceptor chain or return an explicit error early. Returning without invoking next short-circuits downstream handlers, while duplicate calls cause duplicate execution.

4. **Perform Cryptographic Verification and Scope Validation in Security Handlers**

Goa security scheme definitions do not automatically validate or parse tokens at runtime. Implement explicit cryptographic signature validation, expiration checking, and verify scopes using `scheme.Validate()` inside authentication handler functions.

5. **Define Secure Service-to-Service Schemes and Transport Metadata**

Use schemes like `JWTSecurity`, `BearerSecurity`, or `OAuth2Security` with `ClientCredentialsFlow` for machine-to-machine authentication. Tag service tokens in method payloads with `Meta("security:token")` so they map automatically into gRPC request metadata headers.

6. **Route All Incoming Traffic Through Generated Endpoints**

Always wrap your business logic implementation in generated endpoints and servers using generated builders. This ensures that Goa validates request data against constraints declared in the design before invoking service methods.

7. **Configure Restrictive SameSite and Secure Cookie Attributes**

Explicitly apply `CookieSameSiteStrict` or `CookieSameSiteLax` to HTTP session or authentication cookies, and ensure session tokens enforce secure transmission and prevent client-side script access by including `CookieSecure()` and `CookieHTTPOnly()`.

8. **Restrict Static File Routes to Dedicated Asset Directories**

When using the `Files` DSL function to configure static file serving, ensure target paths point specifically to safe asset folders rather than broad file system roots or internal directories to prevent exposing sensitive files.

9. **Enforce Strict Input Validation, Formats, and Required Attributes**

Use validation functions such as `Pattern`, `MinLength`, `MaxLength`, `Format`, `Minimum`, `Maximum`, `Enum`, and `Required` within your Goa DSL definitions to ensure transport layers automatically enforce strict input boundaries and reject invalid or unbounded data.

10. **Validate and Normalize Custom Unmarshaled Parameters**

When custom Go types override generated unmarshaling or handle HTTP parameters implementing `encoding.TextUnmarshaler`, implement strict checks to normalize inputs and reject malformed, empty, or oversized values before storing them.

11. **Harden Interface Protocols, Path Parameters, and Header Mappings**

Ensure that all alternative routes mapped to a single Goa endpoint define identical sets of path parameters, restrict response header and cookie mappings to primitive types, and map attributes uniquely between gRPC metadata and message bodies without duplication.

12. **Secure API Gateway and Proxy Trust Boundaries**

Configure `grpcm.UseXRequestIDMetadataOption(true)` paired with `grpcm.XRequestMetadataLimitOption` to truncate incoming request IDs, and only trust forwarded IP headers when requests originate from trusted gateway addresses.

13. **Specify Encrypted Transport Schemes and Validated Host Variables**

When defining `Server` and `Host` expressions in the Goa DSL, explicitly specify encrypted transport schemes such as `https` or `grpcs` for non-local environments and ensure all URI variables specify primitive types along with explicit default values or enum validation rules.

14. **Validate Target Base URLs and Restrict Outbound RPC Clients**

Parse raw base URLs using `url.Parse`, verify that the scheme is restricted to allowed protocols, confirm that the hostname matches an explicit allowed host list, and configure transport options to revalidate every request including redirects and reject disallowed resolved IPs.

15. **Use String or Bytes Types for Plain Text and HTML Responses**

When explicitly defining HTTP responses with a `Content-Type` of `text/html` or `text/plain`, ensure the response body or service result type is defined strictly as `String` or `Bytes`.

16. **Configure Bounded Server Timeouts and Header Limits**

Set explicit timeouts including `ReadHeaderTimeout`, `ReadTimeout`, `WriteTimeout`, and `IdleTimeout`, along with a request header size limit via `MaxHeaderBytes` when initializing `http.Server` to prevent slowloris attacks and resource exhaustion.

17. **Load Model Provider Credentials and Secrets via Environment Variables**

Retrieve sensitive credentials dynamically using `os.Getenv` when configuring client options to prevent exposing API keys in version control systems and generated artifacts.

18. **Secure Distributed Tracing and Filter Sensitive Data**

Use `middleware.DiscardFromTrace` with explicit regular expressions to exclude sensitive endpoints handling authentication tokens or credentials from trace generation, and filter out sensitive context keys before exporting metadata to traces or logs.

19. **Fail Closed and Order Interceptors to Enforce Security First**

Validate inputs or permissions in custom server interceptors prior to invoking the next handler in the chain. If validation fails, return an error immediately and do not invoke the next handler to prevent unauthorized requests from executing underlying service logic.
