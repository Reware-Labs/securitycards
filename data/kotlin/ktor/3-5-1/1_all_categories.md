# Security cards

Repository: `https://github.com/ktorio/ktor#3.5.1`

## Category: api contract misuse

### Supply Matching Delegates When Configuring Custom NSURLSession in Darwin Engine

**Use when**

Configuring a custom `NSURLSession` for the Ktor Darwin client engine using `DarwinClientEngineConfig.usePreconfiguredSession`.

**Secure rules**

**Rule 1: Always supply both the custom `NSURLSession` and its matching `KtorNSURLSessionDelegate` instance to prevent initialization exceptions and broken request handling.**

When configuring a custom `NSURLSession` using `DarwinClientEngineConfig.usePreconfiguredSession`, you must provide the session along with its corresponding `KtorNSURLSessionDelegate` instance. Passing a session without its matching delegate causes an `IllegalArgumentException` at initialization and disrupts Ktor's internal pipeline and delegation mechanism for network events and authentication challenges.

```kotlin
val delegate = KtorNSURLSessionDelegate()
val session = NSURLSession.sessionWithConfiguration(
    NSURLSessionConfiguration.defaultSessionConfiguration(),
    delegate,
    delegateQueue = NSOperationQueue()
)

val client = HttpClient(Darwin) {
    engine {
        usePreconfiguredSession(session, delegate)
    }
}
```


## Category: authentication

### Configure JWT Signature, Audience, and Issuer Validation

**Use when**

When establishing and verifying token-based identity credentials using JSON Web Tokens in Ktor server applications.

**Secure rules**

**Rule 1: Configure a valid signature verifier and validate claim requirements like audience, issuer, and key ID inside the jwt authentication block.**

Always supply signature verifiers and explicit claim checks to prevent accepting forged or cross-domain tokens. Ensure custom validation blocks return null when credentials fail validation requirements.

```kotlin
install(Authentication) {
    jwt {
        realm = "my-realm"
        verifier(issuer, audience, algorithm)
        validate { credential ->
            if (credential.payload.audience.contains(audience)) {
                JWTPrincipal(credential.payload)
            } else null
        }
    }
}
```


### Enforce Mutual TLS Authentication and Restrict Client Token Transmission

**Use when**

When configuring TLS mutual authentication or managing client authentication tokens and preemptive request headers.

**Secure rules**

**Rule 1: Configure key stores and trust managers explicitly when establishing mutual TLS connections.**

Supply valid client key stores and trust managers to ensure peers verify each other's identities correctly during handshakes.

```kotlin
val client = HttpClient(CIO) {
    engine {
        https {
            trustManager = caTrustStore.trustManagers.first()
            addKeyStore(clientKeyStore, password)
        }
    }
}
```

**Rule 2: Restrict `sendWithoutRequest` predicates in client auth plugins to avoid leaking credentials to unintended paths.**

Define strict matching criteria based on target URLs or paths in `sendWithoutRequest` rather than returning true unconditionally.

```kotlin
HttpClient {
    install(Auth) {
        basic {
            credentials { BasicAuthCredentials("MyUser", "SecretPassword") }
            sendWithoutRequest { request ->
                request.url.encodedPath.startsWith("/api/v1/protected")
            }
        }
    }
}
```


### Implement Mandatory Validation and Fallback Handlers for Authentication Providers

**Use when**

When configuring authentication plugins such as basic, digest, API key, and OAuth in Ktor applications to verify credentials and handle failures.

**Secure rules**

**Rule 1: Configure mandatory validation functions and return null when credentials fail verification checks.**

Always supply validate functions and digest providers for basic, digest, and API key authentication blocks so missing or invalid credentials properly trigger unauthenticated challenge responses.

```kotlin
install(Authentication) {
    basic("auth-basic") {
        realm = "ktor-app"
        validate { credentials ->
            if (credentials.name == "user" && credentials.password == "pass") {
                UserIdPrincipal(credentials.name)
            } else {
                null
            }
        }
    }
}
```

**Rule 2: Configure explicit fallback handlers for OAuth authentication flows to process errors gracefully.**

Set up explicit fallback blocks on OAuth authentication providers to handle authorization errors or failed token exchanges safely without exposing internal exceptions.

```kotlin
install(Authentication) {
    oauth("oauthProvider") {
        client = httpClient
        providerLookup = { oauthSettings }
        urlProvider = { "http://localhost/login/callback" }
        fallback = { cause ->
            if (cause is OAuth2RedirectError) {
                respondRedirect("/login?error=denied")
            } else {
                respond(HttpStatusCode.Forbidden, "OAuth exchange failed")
            }
        }
    }
}
```


### Protect Routing Endpoints and WebSocket Handshakes with Authentication Blocks

**Use when**

When securing HTTP routes, API key protected endpoints, or WebSocket connection handshakes in Ktor applications.

**Secure rules**

**Rule 1: Enclose protected routes and WebSocket endpoints within `authenticate` blocks referencing valid providers.**

Wrap all sensitive routes and WebSocket connections inside an `authenticate` block to ensure that unauthenticated requests are rejected before executing route logic.

```kotlin
install(Authentication) {
    apiKey("api-key") {
        validate { key ->
            if (key == "valid-key") UserIdPrincipal("user") else null
        }
    }
}

routing {
    authenticate("api-key") {
        get("/authenticated") {
            val principal = call.principal<UserIdPrincipal>()
            call.respond(principal!!)
        }
    }
}
```


## Category: configuration source integrity

### Prevent configuration failure by validating structural integrity and environment bindings

**Use when**

When loading configuration files and setting environment properties in Ktor applications.

**Secure rules**

**Rule 1: Avoid recursive reference loops in YAML configuration files.**

Ensure self-referencing property aliases in YAML configurations do not introduce circular references, as Ktor's `YamlConfig` will raise an `ApplicationConfigurationException` to block invalid configuration loading.

```yaml
value:
  domain: "example.com"
config:
  endpoint: "https://${value.domain}/api"
```

**Rule 2: Ensure all referenced environment variables are defined prior to application launch.**

Verify that all environment variables referenced in YAML configuration files are explicitly defined in the runtime environment to prevent initialization failures when `YamlConfig` fails fast.

```yaml
ktor:
  deployment:
    port: $PORT
```

**Rule 3: Safely read optional properties and deserialize typed configurations from ApplicationConfig.**

Use `propertyOrNull` to access optional key-value properties or `getAs` to map typed configuration objects safely instead of throwing unhandled exceptions.

```kotlin
val config = MapApplicationConfig(
    "host" to "0.0.0.0",
    "port" to "8080"
)

val salt: String? = config.propertyOrNull("auth.salt")?.getString()
val rootConfig: RootConfig? = config.getAs<RootConfig>()
```

**Rule 4: Ensure all dynamically referenced dependency factory functions and classes are publicly accessible.**

Verify that functions and classes loaded via external application configuration files are publicly accessible to avoid `DependencyInjectionException` during dependency injection initialization.

```kotlin
fun createBankService(): BankService = BankServiceImpl()
```


## Category: cryptography

### Use secure cryptographic algorithms and parameters for encryption and token generation

**Use when**

When configuring cryptographic mechanisms such as HTTP digest authentication, session encryption transformers, and random nonce generation within Ktor applications.

**Secure rules**

**Rule 1: Configure strong cryptographic hash algorithms for HTTP Digest authentication**

Avoid legacy `MD5` defaults in HTTP Digest authentication by specifying strong algorithms like `DigestAlgorithm.SHA_256` or `DigestAlgorithm.SHA_512_256` to prevent collision and offline cracking attacks.

```kotlin
install(Authentication) {
    digest {
        realm = "Protected Realm"
        algorithms = listOf(DigestAlgorithm.SHA_256, DigestAlgorithm.SHA_512_256)
        supportedQop = listOf(DigestQop.AUTH)
        digestProvider { userName, realm, algorithm ->
            computeHA1(userName, realm, password, algorithm)
        }
    }
}
```

**Rule 2: Disable session encryption backward compatibility after migration**

Keep `backwardCompatibleRead` set to `false` in `SessionTransportTransformerEncrypt` during normal operations to prevent older payload formats and legacy cryptographic signature layouts from being accepted.

```kotlin
val encryptKey = "00112233445566778899aabbccddeeff".hexToByteArray()
val signKey = "02030405060708090a0b0c".hexToByteArray()

install(Sessions) {
    cookie<TestUserSession>("SESSION_COOKIE") {
        transform(
            SessionTransportTransformerEncrypt(
                encryptKey = encryptKey,
                signKey = signKey,
                backwardCompatibleRead = false
            )
        )
    }
}
```

**Rule 3: Generate cryptographically secure nonces using Ktor utilities**

Utilize `generateNonceBlocking()` or `generateNonce()` to generate secure random strings, session identifiers, and tokens across platforms to prevent predictable values.

```kotlin
import io.ktor.util.generateNonceBlocking

val nonce: String = generateNonceBlocking()
check(nonce.length == 32)
```


## Category: csrf

### Configure Origin and Header Validation in Ktor CSRF Plugin

**Use when**

When implementing cross-site request forgery protection for state-changing HTTP requests using Ktor's CSRF plugin.

**Secure rules**

**Rule 1: Explicitly configure allowed origins and header validation rules when installing the CSRF plugin to prevent rejecting valid production requests or leaving endpoints vulnerable.**

Use `allowOrigin`, `originMatchesHost`, or `checkHeader` within the `CSRF` plugin configuration block to validate incoming state-changing requests. Ensure proper predicate checks or trusted origins are defined to protect state-modifying endpoints such as POST or PUT while safely ignoring safe methods.

```kotlin
route("/api") {
    install(CSRF) {
        allowOrigin("https://app.example.com")
        originMatchesHost()
        checkHeader("X-CSRF-Token") { token ->
            token == "expected-valid-token"
        }
    }
}
```


## Category: file handling

### Prevent directory traversal by using Ktor static content routing and resource resolution APIs

**Use when**

Serving static files, directories, or embedded classpath resources from user-supplied paths or URL parameters.

**Secure rules**

**Rule 1: Use built-in static content DSL and resource resolution functions to automatically validate request paths and prevent directory traversal.**

Utilize Ktor's built-in static content DSL such as `staticFiles`, `staticResources`, and `staticFileSystem`, or call `call.resolveResource()` to serve files safely. These functions automatically validate request paths, block parent directory relative paths (`..`), URL-encoded dots (`%2e%2e`), or backslashes, and ensure that path traversal attempts cannot escape the defined static root directory.

```kotlin
routing {
    staticFiles("static", File("/app/public"))
}
```


## Category: injection

### Sanitize Untrusted Input for LDAP Queries

**Use when**

When constructing dynamic LDAP queries or Distinguished Names using untrusted user inputs in Ktor server applications.

**Secure rules**

**Rule 1: Neutralize special LDAP characters in user-supplied strings before building query filters or Distinguished Names.**

Pass all dynamic user input strings through `ldapEscape` to ensure meta-characters are safely escaped and interpreter syntax neutralization is maintained.

```kotlin
val safeUsername = ldapEscape(userInput)
val userDn = "cn=$safeUsername,ou=users,dc=example,dc=com"
```


## Category: input contract definition

### Validate incoming request payloads with RequestValidation and StatusPages

**Use when**

When validating incoming request bodies and handling malformed input data in Ktor applications.

**Secure rules**

**Rule 1: Configure Ktor request validation rules to reject malformed input payloads before application processing.**

Install the `RequestValidation` plugin and define rules using `validate<T>` or filter blocks to enforce strict input boundaries and type constraints. Pair this with `StatusPages` to catch `RequestValidationException` and return an appropriate HTTP error response.

```kotlin
install(RequestValidation) {
    validate<String> { body ->
        if (!body.startsWith("+")) {
            ValidationResult.Invalid("String must start with '+'")
        } else {
            ValidationResult.Valid
        }
    }
}
install(StatusPages) {
    exception<RequestValidationException> { call, cause ->
        call.respond(HttpStatusCode.BadRequest, cause.reasons.joinToString(", "))
    }
}
```


## Category: input interpretation safety

### Canonicalize and parse untrusted URL and header strings safely

**Use when**

When validating, parsing, or normalizing untrusted URL strings, authentication headers, or cookie values to ensure security decisions rely on unambiguous interpretations.

**Secure rules**

**Rule 1: Use parseUrl instead of direct Url constructor calls when processing untrusted URL strings.**

Invoke `parseUrl()` to evaluate untrusted or user-supplied URL inputs. This approach gracefully returns null when encountering malformed specifications or invalid encoding, preventing uncaught runtime exceptions and potential parsing bypasses during input validation.

```kotlin
val untrustedInput = "https://example.com?url=https%3A%2F%2Fwww.google.com%2"
val url = parseUrl(untrustedInput)
if (url == null) {
    // Reject invalid URL input safely
} else {
    // Proceed with validated Url object
}
```

**Rule 2: Normalize internationalized and multi-byte domain names using Ktor URL builders.**

Convert URLs containing internationalized domain names or non-ASCII characters using Ktor's `Url` builder and `toNSUrl()`. This ensures Punycode encoding is applied correctly to hostnames and percent-encoding is applied to query parameters before native platform calls.

```kotlin
val safeUrl = Url("http://привет.привет/echo_query?привет")
val nsUrl = safeUrl.toNSUrl()
```

**Rule 3: Encode cookie values instead of using RAW encoding**

Do not render data that may contain untrusted characters with `CookieEncoding.RAW`. Use `CookieEncoding.URI_ENCODING`, which is also Ktor’s default, so the cookie value is encoded when the `Set-Cookie` header is rendered. Treat values returned by `parseServerSetCookieHeader` as decoded application data rather than as sanitized header text.

```kotlin
import io.ktor.http.Cookie
import io.ktor.http.CookieEncoding
import io.ktor.http.renderSetCookieHeader

val cookie = Cookie(
    name = "session",
    value = "line1\r\nline2; role=admin",
    encoding = CookieEncoding.URI_ENCODING,
    secure = true,
    httpOnly = true
)

val setCookieHeader = renderSetCookieHeader(cookie)
```


## Category: interface protocol hardening

### Enforce Protocol and Content-Type Validation in SSE and WebSocket Sessions

**Use when**

Developing client applications using Ktor HTTP, SSE, or WebSocket engines where protocol framing, content types, and connection state must be strictly enforced.

**Secure rules**

**Rule 1: Validate that server responses enforce expected HTTP status codes and content types when establishing server-sent events streams.**

Catch `SSEClientException` when initializing SSE sessions to handle invalid content types or non-200 responses properly rather than parsing incorrect payloads.

```kotlin
val client = HttpClient {
    install(SSE)
}

try {
    client.sse("https://api.example.com/events") {
        incoming.collect { event ->
            // Process valid SSE events safely
        }
    }
} catch (e: SSEClientException) {
    logger.error("SSE stream connection failed: ${e.message}", e)
}
```

**Rule 2: Avoid sending reserved WebSocket close codes over network boundaries.**

Do not transmit reserved RFC 6455 close codes such as 1006 during WebSocket session closure to maintain specification compliance.

```kotlin
client.webSocket("ws://localhost/ws") {
    outgoing.send(Frame.Close(CloseReason(CloseReason.Codes.NORMAL, "User logged out")))
}
```


## Category: network boundary

### Enforce strict TLS certificate hostname verification and avoid authentication bypass

**Use when**

Configuring TLS connections and validating server certificates or hostnames in Ktor client applications.

**Secure rules**

**Rule 1: Enforce strict wildcard and domain matching during TLS hostname verification.**

Rely on Ktor's built-in hostname verification functions to strictly validate domain labels, ignore trailing dots, perform case-insensitive comparisons, and reject overly broad wildcards or invalid wildcard positions.

```kotlin
val match1 = matchHostnameWithCertificate("www.example.com", "*.example.com") // true
val match2 = matchHostnameWithCertificate("www.example.com", "*.com") // false (rejected TLD wildcard)
val match3 = matchHostnameWithCertificate("www.sub.example.com", "www.*.example.com") // false (rejected non-prefix wildcard)
```

**Rule 2: Avoid bypassing TLS certificate validation in production client configurations.**

Do not use custom authentication challenge handlers that automatically trust any server certificate without evaluation. Use standard default handling for server trust challenges to allow the operating system to perform full certificate chain validation.

```swift
completionHandler(NSURLSessionAuthChallengePerformDefaultHandling, null)
```


## Category: resource exhaustion

### Enforce Frame Size Limits on WebSockets and Bounded Redirections in Ktor Clients

**Use when**

Configuring Ktor client plugins such as `WebSockets` and `HttpRedirect` to handle remote network streams and untrusted server interactions safely.

**Secure rules**

**Rule 1: Configure explicit maximum frame sizes on WebSocket sessions to prevent memory exhaustion.**

When installing the `WebSockets` plugin in the Ktor client, set `maxFrameSize` to an appropriate threshold to prevent malicious or malfunctioning remote endpoints from sending oversized frames that consume excessive heap memory.

```kotlin
val client = HttpClient {
    install(WebSockets) {
        maxFrameSize = 1024 * 1024 // Set maximum frame size to 1MB
    }
}
```

**Rule 2: Bound automatic redirect loops in HTTP client configurations**

When automatic redirect handling is enabled (the default, or via the `HttpRedirect` plugin), bound the number of requests that may be sent during a single call—including those caused by redirects—by configuring `maxSendCount` on the always-installed `HttpSend` plugin. Exceeding the limit throws `SendCountExceedException` so that cyclic redirect responses fail fast rather than consuming memory and network resources indefinitely. The default value is 20.

```kotlin
val client = HttpClient {
    install(HttpSend) {
        maxSendCount = 20
    }
}
```

**Rule 3: Specify an explicit limit parameter when parsing raw query strings.**

When parsing raw query strings manually using `parseQueryString`, specify an explicit limit parameter to cap the maximum number of query key-value pairs processed and avoid high memory consumption.

```kotlin
val parameters = parseQueryString(rawQuery, startIndex = 0, limit = 100)
```


## Category: secret handling

### Sanitize Sensitive Headers During Client Logging

**Use when**

Configuring client logging for Ktor HTTP requests and responses that contain sensitive authentication headers or tokens.

**Secure rules**

**Rule 1: Sanitize sensitive HTTP headers to prevent credential leakage into log files.**

When configuring the `Logging` plugin with `header` or `full` logging levels, use `sanitizeHeader` to redact sensitive headers like `Authorization` or custom secret headers before they are written to logs.

```kotlin
install(Logging) {
    level = LogLevel.HEADERS
    logger = Logger.DEFAULT
    sanitizeHeader("<redacted>") { headerName ->
        headerName.equals(HttpHeaders.Authorization, ignoreCase = true) || headerName.equals("X-Api-Key", ignoreCase = true)
    }
}
```


## Category: security control integrity

### Avoid Authentication Bypass via Loose SkipWhen Conditions

**Use when**

When configuring authentication providers and routing paths where certain requests need to be treated as public or excluded from authentication requirements.

**Secure rules**

**Rule 1: Avoid relying on `skipWhen` conditions with untrusted request parameters to bypass authentication checks.**

Do not use loose or untrusted request inputs such as request URIs or headers inside `skipWhen` conditions within authentication provider configurations because this can bypass authentication completely. Instead, define public routes entirely outside the `authenticate` routing DSL block.

```kotlin
routing {
    get("/public") {
        call.respondText("Public content")
    }
    authenticate {
        get("\/secure") {
            call.respondText("Protected content")
        }
    }
}
```


## Category: session management

### Clear session state and invalidate cookies securely on logout

**Use when**

Handling user logout actions and terminating active session states in Ktor server applications.

**Secure rules**

**Rule 1: Explicitly clear server-side session state and invalidate client session cookies during user logout.**

Always clear session state explicitly using `call.sessions.clear<SessionType>()` when executing logout actions, and ensure session cookie configurations correctly preserve security flags while handling termination. When invalidating cookies via `call.response.cookies.append`, supply `maxAge = -1` or `0` alongside matching domain and path attributes so the browser successfully drops the token.

```kotlin
routing {
    authenticate("auth-session") {
        get("/logout") {
            call.sessions.clear<UserSession>()
            call.respondRedirect("/login")
        }
    }
}
```


### Enforce secure transport attributes and server-side storage for sensitive session cookies

**Use when**

Configuring session storage backends, cookie flags, and secure transport mechanisms.

**Secure rules**

**Rule 1: Configure server-side session storage and enforce strict secure flags on session cookies to prevent exposure.**

Supply a server-side `SessionStorage` implementation when configuring sessions containing sensitive user data so that only a random identifier is sent to the client. Set `cookie.secure = true` and appropriate `SameSite` policies to restrict transmission to encrypted connections and prevent interception or cross-site leakage.

```kotlin
val sessionStorage = SessionStorageMemory()

install(Sessions) {
    cookie<UserSession>("MY_SESSION", sessionStorage) {
        cookie.maxAge = 3600.seconds
        cookie.httpOnly = true
        cookie.secure = true
    }
}
```


### Validate session identifiers and authenticate session principals on incoming requests

**Use when**

Processing incoming requests and verifying session authenticity in protected routes.

**Secure rules**

**Rule 1: Verify that session lookup and authentication hooks successfully resolve valid, non-null session principals.**

Configure session authentication with an explicit `validate` block that checks session validity, and always check for null when fetching session data via `call.sessions.get<T>()`. Unrecognized or expired session identifiers should immediately trigger invalidation or return unauthorized responses.

```kotlin
install(Sessions) {
    cookie<UserSession>("SESSION_ID", storage)
}

routing {
    get("/protected") {
        val session = call.sessions.get<UserSession>()
        if (session == null) {
            call.respond(HttpStatusCode.Unauthorized, "Invalid or expired session")
            return@get
        }
        call.respondText("Welcome, ${session.userId}")
    }
}
```
