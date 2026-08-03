# Security cards

Repository: `https://github.com/goadesign/goa#v3.28.0`
Documentation repository: `https://github.com/goadesign/goa.design#main`

## Category: access control

### Exempt health check endpoints from global service authorization using NoSecurity

**Use when**

Defining health check, liveness probe, or management endpoints in the Goa DSL that need to bypass inherited global security requirements.

**Secure rules**

**Rule 1: Explicitly call NoSecurity within the health check method expression to allow unauthenticated access by monitoring systems and load balancers.**

When global security requirements are declared at the API or Service level, management and health endpoints inherit those authentication rules by default. To allow unauthenticated health probes to access these endpoints without exposing sensitive credentials or causing orchestrator failures, explicitly call `NoSecurity()` within the health check `Method` expression.

```go
Method("health-check", func() {
    Description("Check service health status")
    NoSecurity()
    HTTP(func() {
        GET("/healthz")
    })
})
```


### Verify User Ownership and Tenant Constraints on Data Access

**Use when**

When building data query and record update methods in Goa services where access must be restricted to the authenticated record owner or tenant.

**Secure rules**

**Rule 1: Verify record ownership and tenant constraints before processing data updates or queries.**

Always ensure that the authenticated user owns the requested record or belongs to the target tenant before allowing data modification or retrieval. Enforce explicit tenant and ownership checks in your service logic.


## Category: api contract misuse

### Invoke next exactly once in Goa server interceptors

**Use when**

Implementing custom Goa server interceptors to inspect, validate, or mutate requests and responses.

**Secure rules**

**Rule 1: Call the next endpoint function exactly once in server interceptors and handle returned errors properly**

When writing Goa `ServerInterceptors`, strictly invoke `next(ctx, info.RawPayload())` exactly once to progress through the interceptor chain, or return an explicit error or response early. Returning without invoking next short-circuits downstream interceptors and the endpoint, while duplicate calls can cause duplicate execution, and errors returned by next must not be inadvertently discarded.

```go
func (i *Interceptors) RequestAudit(ctx context.Context, info *RequestAuditInfo, next goa.Endpoint) (any, error) {
    res, err := next(ctx, info.RawPayload())
    if err != nil {
        return nil, err
    }
    return res, nil
}
```


## Category: authentication

### Implement explicit credential verification and scope validation in Goa security handlers

**Use when**

When writing custom authentication handlers and security functions in Goa services to verify credentials, check token validity, and validate scopes.

**Secure rules**

**Rule 1: Perform thorough credential validation and verify scopes inside authentication handler functions**

Authentication functions such as `AuthAPIKeyFunc` receive credential strings along with scheme metadata. You must validate the authenticity of the credentials, verify scopes against the scheme using `scheme.Validate()`, and return a fully populated context containing the authenticated identity.

```go
func AuthenticateAPIKey(ctx context.Context, key string, scheme *security.APIKeyScheme) (context.Context, error) {
	user, err := validateAPIKey(key)
	if err != nil {
		return ctx, fmt.Errorf("invalid API key: %w", err)
	}
	if err := scheme.Validate(user.Scopes); err != nil {
		return ctx, fmt.Errorf("insufficient scope: %w", err)
	}
	return context.WithValue(ctx, userCtxKey, user), nil
}
```

**Rule 2: Implement manual token parsing, signature validation, and expiration checks in security handlers**

Goa security scheme definitions like `JWTSecurity` and `BearerSecurity` do not automatically validate or parse tokens at runtime. They only pass raw token strings to your security handler, meaning you must implement explicit cryptographic signature validation, expiration checking, and claim verification.

```go
var JWT = JWTSecurity("jwt", func() {
    Scope("api:read", "Read access")
})

Method("get_profile", func() {
    Security(JWT, func() {
        Scope("api:read")
    })
    Payload(func() {
        Token("token", String)
        Required("token")
    })
})
```


### Implement service-to-service authentication and credential validation in Goa

**Use when**

Developing inter-service communication and microservice endpoints where callers must authenticate using tokens, OAuth2 client credentials, or gRPC metadata.

**Secure rules**

**Rule 1: Define explicit security schemes and enforce them across services or methods using Goa's design DSL.**

Use schemes like `JWTSecurity`, `BearerSecurity`, or `OAuth2Security` with `ClientCredentialsFlow` to define machine-to-machine authentication requirements. Apply them to services or methods using `Security()` along with required scopes.

```go
var ServiceAuth = OAuth2Security("service_auth", func() {
    ClientCredentialsFlow("/oauth2/token", "/oauth2/refresh")
    Scope("svc:read", "Read access for service callers")
})

var _ = Service("internal_service", func() {
    Security(ServiceAuth, func() {
        Scope("svc:read")
    })
})
```

**Rule 2: Validate token signatures, validity, and required scopes within service authentication handlers.**

Implement authentication functions such as `AuthJWTFunc` or `AuthOAuth2Func` to verify incoming service tokens and explicitly validate required scopes using `s.Validate(scopes)` before injecting the verified caller identity into the context.

```go
func AuthenticateServiceJWT(ctx context.Context, token string, s *security.JWTScheme) (context.Context, error) {
	claims, err := parseAndVerifyServiceToken(token)
	if err != nil {
		return ctx, fmt.Errorf("unauthorized service token: %w", err)
	}
	if err := s.Validate(claims.Scopes); err != nil {
		return ctx, fmt.Errorf("insufficient service scopes: %w", err)
	}
	return context.WithValue(ctx, serviceIdentityKey, claims.Subject), nil
}
```

**Rule 3: Configure secure credential transport locations for gRPC service calls.**

Tag service authentication tokens in method payloads with metadata directives like `Meta("security:token")` so that `GRPCEndpointExpr.Finalize` automatically maps them into gRPC request metadata headers instead of standard request fields.

```go
var _ = Service("order_service", func() {
    Security(JWTAuth)
    Method("CreateOrder", func() {
        Payload(func() {
            Token("token", String, "Service identity token", func() {
                Meta("security:token")
            })
            Attribute("order_id", String)
        })
        GRPC(func() {
            Response(CodeOK)
        })
    })
})
```


## Category: boundary control

### Enforce System Boundary Validation via Generated Endpoints

**Use when**

When routing incoming HTTP and gRPC traffic to service implementations and handling data payloads at the application boundary.

**Secure rules**

**Rule 1: Route all incoming traffic through Goa's generated transport endpoints and servers to enforce automatic boundary validation**

Always wrap your business logic implementation in generated endpoints and servers using `gencalc.NewEndpoints` and `genhttp.New`. This ensures that Goa validates request data against constraints declared in the design before invoking the service method; request bodies using SkipRequestBodyEncodeDecode require application validation.

```go
svc := calc.New()
endpoints := gencalc.NewEndpoints(svc)
mux := goahttp.NewMuxer()
server := genhttp.New(endpoints, mux, goahttp.RequestDecoder, goahttp.ResponseEncoder, nil, nil)
genhttp.Mount(mux, server)
```


## Category: csrf

### Configure strict SameSite attributes for session cookies

**Use when**

When defining HTTP session or authentication cookies in Goa design definitions to prevent cross-site request forgery.

**Secure rules**

**Rule 1: Configure restrictive SameSite behavior for cookie attributes using CookieSameSiteValue constants.**

Explicitly apply `CookieSameSiteStrict` or `CookieSameSiteLax` to HTTP session or authentication cookies in Goa designs. Using `CookieSameSiteNone` or omitting explicit SameSite constraints increases exposure to Cross-Site Request Forgery attacks across cross-origin requests.


## Category: file handling

### Restrict static file route definitions to public asset directories

**Use when**

When configuring static file serving and asset routing using Goa's design DSL.

**Secure rules**

**Rule 1: Restrict target filesystem paths strictly to dedicated public static directories and avoid pointing to root or internal application directories.**

When using the `Files` DSL function to configure static file serving, ensure target paths point specifically to safe assets folders rather than broad file system roots or internal directories to prevent exposing sensitive files.

```go
var _ = Service("web", func() {
    // Serve assets strictly from a dedicated static assets folder
    Files("/assets/{*path}", "./public/assets")
    // Serve specific safe index file
    Files("/", "./public/index.html")
})
```


## Category: input contract definition

### Enforce Strict Input Validation and Schema Constraints in Goa DSL

**Use when**

Defining API service payloads, parameters, headers, cookies, or agent tool arguments using Goa's design DSL to reject malformed or out-of-contract inputs before processing.

**Secure rules**

**Rule 1: Define explicit validation constraints and primitive formats on attributes using Goa DSL validation primitives.**

Use validation functions such as Pattern, MinLength, MaxLength, Format, Minimum, Maximum, Enum, and Required within your Goa DSL definitions to ensure transport layers automatically enforce strict input boundaries and reject invalid or unbounded data.

```go
var UserProfile = Type("UserProfile", func() {
    Attribute("username", String, func() {
        Pattern("^[a-z0-9]+$")
        MinLength(3)
        MaxLength(50)
    })
    Attribute("email", String, func() {
        Format(FormatEmail)
    })
    Attribute("role", String, func() {
        Enum("admin", "user", "guest")
    })
    Required("username", "email", "role")
})
```

**Rule 2: Declare mandatory attributes explicitly as required or pointer types to prevent zero-value defaults.**

Because Go primitive types cannot be nil, explicitly include mandatory fields inside the Required DSL expression so Goa's validation generator prevents missing inputs from silently falling back to zero values.

```go
var CreateUserPayload = Type("CreateUserPayload", func() {
    Attribute("user_id", String, "User identifier")
    Attribute("account_id", String, "Account identifier")
    Required("user_id", "account_id")
})
```


## Category: input interpretation safety

### Validate and normalize custom unmarshaled string attributes and parameters

**Use when**

Implementing custom unmarshaling logic for Go types used as string attributes or HTTP path and query parameters in Goa designs.

**Secure rules**

**Rule 1: Validate formats and bounds explicitly inside custom text and format unmarshalers**

When custom Go types override generated unmarshaling via `struct:field:type` or handle HTTP parameters implementing `encoding.TextUnmarshaler`, implement strict checks to normalize inputs and reject malformed, empty, or oversized values before storing them.

```go
type CustomUUID string

func (c *CustomUUID) UnmarshalText(text []byte) error {
    if err := goa.ValidateFormat(goa.FormatUUID, string(text)); err != nil {
        return fmt.Errorf("invalid UUID: %w", err)
    }
    *c = CustomUUID(text)
    return nil
}
```


## Category: interface protocol hardening

### Enforce Consistent Path Parameters and Primitive Header Mappings in Goa Protocol Definitions

**Use when**

Use when defining routing, HTTP endpoints, headers, cookies, and gRPC mappings in Goa service design specifications to ensure strict protocol framing and parameter enforcement.

**Secure rules**

**Rule 1: Ensure that all alternative routes mapped to a single Goa endpoint define identical sets of path parameters**

Goa v3.28.0 requires matching path parameters across every route defined for an endpoint.

```go
var _ = Service("ArticleService", func() {
    Method("Show", func() {
        Payload(func() {
            Attribute("category", String)
            Attribute("id", String)
            Required("category", "id")
        })
        HTTP(func() {
            GET("/articles/{category}/{id}")
            GET("/v1/articles/{category}/{id}")
            Params(func() {
                Param("category")
                Param("id")
            })
        })
    })
})
```

**Rule 2: Restrict HTTP response header and cookie mapping to primitive types in Goa design DSL.**

Verify that service result attributes mapped to HTTP response headers or cookies use only scalar primitive types to prevent invalid protocol headers and header injection risks.

```go
var _ = Service("auth", func() {
    Method("login", func() {
        Result(LoginResult)
        HTTP(func() {
            POST("/login")
            Response(StatusOK, func() {
                Header("token:X-Auth-Token")
                Cookie("session_id:session")
            })
        })
    })
})
```

**Rule 3: Map each attribute uniquely to either gRPC metadata or response message bodies without duplication.**

Structure gRPC responses in the DSL so that headers, trailers, and message attributes remain mutually exclusive to avoid protocol parsing inconsistencies and metadata header pollution.

```go
var _ = Service("AccountService", func() {
    Method("GetAccount", func() {
        Result(AccountResult)
        GRPC(func() {
            Response(CodeOK, func() {
                Headers(func() {
                    Attribute("request_id", String, "Unique request identifier")
                })
            })
        })
    })
})
```

**Rule 4: Authenticate JSON-RPC WebSocket connections at handshake or payload level rather than per-endpoint headers.**

Design WebSocket endpoints to handle authentication within the method payload schema or during the initial HTTP GET handshake since persistent connections multiplex multiple requests over a single TCP stream.

```go
var _ = Service("json_rpc_service", func() {
    Meta("jsonrpc:service", "true")
    Method("stream_data", func() {
        StreamingPayload(func() {
            Attribute("token", String, "Authentication token")
            Attribute("data", String)
            Required("token")
        })
    })
})
```


## Category: network boundary

### Secure API Gateway and Proxy Trust Boundaries for gRPC and HTTP Services

**Use when**

Developing or configuring Goa microservices that sit behind an API gateway, load balancer, or reverse proxy and consume incoming request metadata or forwarding headers.

**Secure rules**

**Rule 1: Explicitly configure gRPC request ID metadata trust and length limits behind API gateways**

When handling gRPC request correlation behind an API gateway or reverse proxy, configure `grpcm.UseXRequestIDMetadataOption(true)` to explicitly trust incoming metadata IDs, and pair it with `grpcm.XRequestMetadataLimitOption` to truncate incoming request IDs to an acceptable boundary length and prevent metadata injection attacks.

```go
import (
	grpcm "goa.design/goa/v3/grpc/middleware"
)

requestIDMiddleware := grpcm.UnaryRequestID(
	grpcm.UseXRequestIDMetadataOption(true),
	grpcm.XRequestMetadataLimitOption(64),
)
```

**Rule 2: Validate trusted proxy context keys before relying on client network identity headers**

Only trust header values extracted via `RequestXForwardedForKey` or `RequestXRealIPKey` when the connection originates from a trusted API gateway IP address stored in `RequestRemoteAddrKey`, or ensure upstream proxies overwrite these headers before reaching the Goa application service.

```go
if remoteAddr, ok := ctx.Value(middleware.RequestRemoteAddrKey).(string); ok && isTrustedProxy(remoteAddr) {
    if forwardedFor, ok := ctx.Value(middleware.RequestXForwardedForKey).(string); ok {
        // Use verified client IP from X-Forwarded-For
    }
}
```


### Specify Secure Schemes and Host Variable Defaults in Server DSL

**Use when**

Defining server and host expressions in the Goa DSL for non-local environments to prevent insecure default transport schemes.

**Secure rules**

**Rule 1: Explicitly define encrypted transport schemes and provide validated default values for host URI variables in your server design.**

When defining `Server` and `Host` expressions in the Goa DSL, explicitly specify encrypted transport schemes such as `https` or `grpcs` for non-local environments. Ensure all URI variables specify primitive types along with explicit default values or enum validation rules to prevent unencrypted fallback and invalid host construction.

```go
var _ = Server("SecureServer", func() {
    Host("production", func() {
        URI("https://{domain}/v1")
        Variable("domain", String, "Host domain", func() {
            Enum("api.example.com", "api-staging.example.com")
            Default("api.example.com")
        })
    })
})
```


### Validate target base URLs and restrict outbound RPC clients to trusted endpoints

**Use when**

Instantiating outbound clients using `url.Parse` and `url.URL.ResolveReference` for HTTP, SSE, or WebSocket requests where target base URLs or endpoint paths are derived from configuration or external inputs.

**Secure rules**

**Rule 1: Validate the URL scheme, hostname, and target IP address prior to issuing requests to prevent server-side request forgery**

Parse the raw base URL using `url.Parse` and explicitly verify that the scheme is restricted to allowed protocols such as `http` or `https`. Confirm that the hostname matches an explicit allowed host list, configure config.HTTPClient.Transport to revalidate every request including redirects and reject disallowed resolved IPs when dialing, and configure config.WSDialer to reject disallowed resolved IPs at connection time before calling harness.NewClient.

```go
parsedURL, err := url.Parse(rawBaseURL)
if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https") {
    return nil, fmt.Errorf("unsupported URL scheme")
}
if !isAllowedHost(parsedURL.Hostname()) {
    return nil, fmt.Errorf("prohibited target host: %s", parsedURL.Hostname())
}
client, err := harness.NewClient(parsedURL.String(), config)
```


## Category: output encoding

### Use String or Bytes types for HTML and plain text HTTP responses

**Use when**

Defining HTTP responses with a `Content-Type` of `text/html` or `text/plain` in Goa service designs.

**Secure rules**

**Rule 1: Define response bodies and service results strictly as `String` or `Bytes` when configuring `text/html` or `text/plain` content types.**

When explicitly defining HTTP responses with a `Content-Type` of `text/html` or `text/plain`, ensure the response body or service result type is defined strictly as `String` or `Bytes` unless `SkipRequestBodyEncodeDecode` or `SkipResponseBodyEncodeDecode` is enabled. Goa's validation logic enforces that structured object types cannot be used directly with plain text or HTML content types.

```go
var _ = Service("web", func() {
    Method("render", func() {
        Result(String)
        HTTP(func() {
            GET("/html")
            Response(StatusOK, func() {
                ContentType("text/html")
            })
        })
    })
})
```


## Category: resource exhaustion

### Configure bounded retries and exponential backoff for WebSocket and JSON-RPC streams

**Use when**

Configuring connection retry behaviors and stream options for JSON-RPC WebSocket connections in Goa services.

**Secure rules**

**Rule 1: Do not rely on jsonrpc.WithRetryConfig to prevent reconnection loops**

In v3.28.0, jsonrpc.WithRetryConfig stores values in StreamConfig, but generated WebSocket clients do not consume them.

```go
cfg := jsonrpc.NewStreamConfig(
	jsonrpc.WithRequestTimeout(30*time.Second),
)
```


### Configure explicit HTTP server timeouts and header limits in production

**Use when**

Configuring and deploying Goa HTTP services in production environments to protect against connection resource exhaustion and header memory consumption attacks.

**Secure rules**

**Rule 1: Always configure explicit timeouts and header size limits on `http.Server`.**

Set explicit timeouts including `ReadHeaderTimeout`, `ReadTimeout`, `WriteTimeout`, and `IdleTimeout`, along with a request header size limit via `MaxHeaderBytes` when initializing `http.Server` for Goa HTTP services in production. This prevents Slowloris attacks, hung connection resource exhaustion, and header memory consumption.

```go
server := &http.Server{
    Addr:              ":8080",
    Handler:           mux,
    ReadHeaderTimeout: 10 * time.Second,
    ReadTimeout:       30 * time.Second,
    WriteTimeout:      60 * time.Second,
    IdleTimeout:       120 * time.Second,
    MaxHeaderBytes:    1 << 20, // 1MB
}
```


## Category: secret handling

### Load Model Provider Credentials via Environment Variables

**Use when**

Instantiating model clients or initializing services that require third-party API keys or sensitive credentials.

**Secure rules**

**Rule 1: Load API keys from external runtime configuration or environment variables instead of hardcoding them in source files.**

Retrieve sensitive credentials dynamically using `os.Getenv` when configuring client options to prevent exposing API keys in version control systems and generated artifacts.

```go
modelClient, err := openai.New(openai.Options{
    APIKey:       os.Getenv("OPENAI_API_KEY"),
    DefaultModel: "gpt-5-mini",
})
if err != nil {
    panic(err)
}
```


### Secure Distributed Tracing and Protect Sensitive Data in Goa

**Use when**

Configuring distributed tracing, gRPC interceptors, HTTP tracing middleware, or handling request context and logging for Goa microservices.

**Secure rules**

**Rule 1: Exclude sensitive methods and endpoints from distributed trace collection and sampling**

Use `middleware.DiscardFromTrace` with explicit regular expressions when configuring HTTP or gRPC tracing to exclude sensitive endpoints handling authentication tokens, credentials, or confidential payload data from trace generation.

```go
authPathPattern := regexp.MustCompile("^/(auth|login|tokens|credentials)")
traceMiddleware := middleware.Trace(
    middleware.DiscardFromTrace(authPathPattern),
)
```

**Rule 2: Sanitize returned errors before recording in X-Ray interceptors**

Ensure sensitive data in returned errors is omitted, masked, or sanitized before being intercepted by `xray.NewUnaryServer` to prevent leaking confidential data into AWS X-Ray.

```go
xrayInterceptor, err := xray.NewUnaryServer("user-service", "127.0.0.1:2000")
if err != nil {
    log.Fatalf("failed to initialize xray interceptor: %v", err)
}

server := grpc.NewServer(
    grpc.ChainUnaryInterceptor(middleware.UnaryServerTrace(), xrayInterceptor),
)
```

**Rule 3: Filter sensitive context keys before exporting to traces or logs**

Selectively extract non-sensitive identifiers like `middleware.RequestXRequestIDKey` for trace correlation, and explicitly filter out sensitive context keys such as `middleware.RequestAuthorizationKey` and `middleware.RequestXCSRFTokenKey` before exporting metadata to traces or logs.

```go
func RecordTraceMetadata(ctx context.Context, span trace.Span) {
    if reqID, ok := ctx.Value(middleware.RequestXRequestIDKey).(string); ok {
        span.SetAttributes(attribute.String("http.request_id", reqID))
    }
}
```


## Category: security control integrity

### Enforce Interceptor Execution Order and Short-Circuit on Validation Failure

**Use when**

When implementing custom server interceptors, wrapping generated endpoints, or managing execution paths in Goa services to ensure security controls run first and fail closed.

**Secure rules**

**Rule 1: Short-circuit execution and return an error immediately upon security validation failure in interceptors**

Validate inputs or permissions in custom server interceptors prior to invoking the next handler in the chain. If validation fails, return an error immediately and do not invoke `next(ctx, ...)` to prevent unauthorized or invalid requests from executing underlying service logic.

```go
func (i *Interceptors) ValidateRequest(ctx context.Context, info *RequestInfo, next goa.Endpoint) (any, error) {
    if err := checkPermissions(ctx, info); err != nil {
        return nil, err // Stop execution chain
    }
    return next(ctx, info.RawPayload())
}
```

**Rule 2: Order interceptors to enforce security checks before business logic execution**

Account for Goa's generated wrapper chain structure when defining interceptors, ensuring security-critical checks such as authentication or audit logging run on incoming requests before payload processing or business execution.

```go
// Conceptual order in generated wrapper:
func WrapGetEndpoint(endpoint goa.Endpoint, i ServerInterceptors) goa.Endpoint {
    endpoint = wrapGetRequestAudit(endpoint, i)
    endpoint = wrapGetJWTAuth(endpoint, i)
    return endpoint
}
```


## Category: session management

### Configure Secure and HTTPOnly Attributes on Response Cookies

**Use when**

Mapping response cookies in Goa HTTP DSL to protect session identifiers and sensitive state from eavesdropping and client-side script access.

**Secure rules**

**Rule 1: Explicitly set security attributes on response cookies using `CookieSecure()` and `CookieHTTPOnly()`.**

When defining response cookies in the Goa HTTP DSL, ensure that session tokens and sensitive state enforce secure transmission and prevent client-side script access by explicitly including `CookieSecure()` and `CookieHTTPOnly()`.

```go
var _ = Service("account", func() {
    Method("login", func() {
        Result(Account)
        HTTP(func() {
            Response(StatusOK, func() {
                Cookie("session:SID", String, func() {
                    Format(FormatGUID)
                })
                CookieMaxAge(3600)
                CookiePath("/session")
                CookieSecure()
                CookieHTTPOnly()
            })
        })
    })
})
```
