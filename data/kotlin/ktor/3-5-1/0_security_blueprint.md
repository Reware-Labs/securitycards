# Security blueprint

Repository: `https://github.com/ktorio/ktor#3.5.1`

## Security posture

Developers working with Ktor must enforce explicit authentication, rigorous input validation, and secure cryptographic and session management practices across client and server boundaries. The framework provides flexible building blocks for routing, serialization, and connection handling, but does not enforce secure defaults for tokens, session storage, or path resolution out of the box. Security-sensitive surfaces include authentication providers, static content routing, URL parsers, and client engine configurations, all of which must be configured to fail closed upon validation failures or malformed inputs.

## Essential implementation rules

1. **Configure Mandatory Validation and Handlers for Authentication Providers**

Always supply mandatory validation functions, signature verifiers, and claim checks for basic, digest, API key, and JWT authentication blocks to ensure missing or invalid credentials properly trigger unauthenticated challenge responses. Set up explicit fallback blocks on OAuth providers and return null when credentials fail validation requirements.

2. **Protect Routing Endpoints and Avoid Loose SkipWhen Conditions**

Enclose all sensitive routes and WebSocket connection handshakes within `authenticate` blocks referencing valid providers to reject unauthenticated requests before executing route logic. Avoid relying on loose request parameters inside `skipWhen` conditions; instead, define public routes entirely outside authentication routing blocks.

3. **Enforce Strict TLS Transport, Hostname Verification, and Mutual TLS**

Rely on Ktor's built-in hostname verification functions to strictly validate domain labels, ignore trailing dots, and reject overly broad wildcards. Configure explicit key stores, trust managers for mutual TLS, and default server trust challenge handling to prevent certificate bypasses.

4. **Validate Incoming Request Payloads and Configure RequestValidation**

Install the `RequestValidation` plugin and define rules using `validate<T>` or filter blocks to enforce strict input boundaries and type constraints. Pair this with `StatusPages` to catch validation exceptions and return appropriate HTTP error responses.

5. **Prevent Directory Traversal Using Static Content Routing**

Utilize Ktor's built-in static content DSL functions such as `staticFiles`, `staticResources`, and `staticFileSystem`, or call `call.resolveResource()`, to automatically validate request paths, block parent directory relative paths (`..`), URL-encoded dots, and backslashes.

6. **Enforce Server-Side Session Storage and Secure Cookie Flags**

Supply a server-side `SessionStorage` implementation when configuring sessions containing sensitive user data, and set `cookie.secure = true` and `cookie.httpOnly = true`. Explicitly clear server session state using `call.sessions.clear<SessionType>()` and invalidate client session cookies with `maxAge = -1` on logout.

7. **Use Secure Cryptographic Algorithms, Nonces, and Disable Backward Compatibility**

Specify strong algorithms like `DigestAlgorithm.SHA_256` for HTTP Digest authentication instead of legacy defaults. Keep `backwardCompatibleRead` set to `false` in session encryption transformers after migration, and utilize `generateNonceBlocking()` to create secure random tokens.

8. **Configure CSRF Protection and Origin Validation Rules**

Explicitly configure allowed origins, host matching rules, or header validation checks using `allowOrigin`, `originMatchesHost`, or `checkHeader` within the `CSRF` plugin block to protect state-modifying endpoints such as POST or PUT.

9. **Neutralize Special Characters in LDAP and URL Inputs**

Pass dynamic user input strings through `ldapEscape` before constructing query filters or Distinguished Names. Use `parseUrl()` instead of direct `Url` constructor calls when processing untrusted URL strings to handle malformed specifications safely.

10. **Enforce Resource Exhaustion Limits on WebSockets, Redirects, and Queries**

Set explicit maximum frame sizes on WebSocket sessions using `maxFrameSize`, bound automatic redirect loops by configuring `maxSendCount` on the `HttpSend` plugin, and specify an explicit limit parameter when manually parsing raw query strings.

11. **Sanitize Sensitive Headers and Configuration Bindings**

Use `sanitizeHeader` when configuring the `Logging` plugin to redact sensitive headers like `Authorization` or custom API keys before writing to log files. Ensure configuration files avoid recursive reference loops and that all referenced environment variables are defined prior to application launch.

12. **Supply Matching Delegates and Enforce Protocol Integrity in Engine Configurations**

When configuring a custom `NSURLSession` for the Darwin client engine using `usePreconfiguredSession`, supply both the session and its matching `KtorNSURLSessionDelegate` instance to prevent initialization exceptions. Validate server responses for expected HTTP status codes and content types when establishing server-sent events streams.
