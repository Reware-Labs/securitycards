# Security cards

Repository: `https://github.com/go-chi/chi#v5.3.1`
Documentation repository: `https://github.com/go-chi/docs#master`

## Category: access control

### Enforce Access Control Middleware Using Router Groups and Subrouters

**Use when**

When organizing routes in Chi and securing endpoints against unauthorized actions or cross-user access

**Secure rules**

**Rule 1: Apply access control and authorization middleware at the router group or subrouter level before defining protected endpoints.**

Use `chi.NewRouter()`, `r.Route()`, or `r.Group()` to isolate middleware stacks and ensure authentication, role checks, and resource loading are executed before handling requests.

```go
r := chi.NewRouter()

// Authenticated endpoints grouped under auth middleware
r.Group(func(r chi.Router) {
	r.Use(AuthMiddleware)
	r.Get("/user/profile", ProfileHandler)
	r.Post("/user/settings", SettingsHandler)
})
```

**Rule 2: Restrict access to sensitive administrative or profiler endpoints using authentication and network boundaries.**

Mount debugging endpoints like `middleware.Profiler()` or administrative subrouters inside protected route groups that enforce strict authorization checks or restrict exposure to internal networks.

```go
r := chi.NewRouter()

// Restrict pprof endpoints to authenticated administrators
r.Group(func(r chi.Router) {
	r.Use(RequireAdminAuth)
	r.Mount("/debug", middleware.Profiler())
})
```


## Category: api contract misuse

### Adhere to Chi API Contracts and Correct Argument Signatures

**Use when**

Integrating Chi routers, middleware components, and custom HTTP method handlers into a Go application.

**Secure rules**

**Rule 1: Pass strictly valid MIME types or trailing wildcard suffixes into compressor configuration constructors.**

When configuring `middleware.Compress` or `middleware.NewCompressor`, specify exact MIME types or trailing wildcard suffixes such as `text/*`. Avoid passing unsupported wildcard patterns like `*/*` to prevent immediate runtime panics during router initialization.

```go
compressor := middleware.NewCompressor(5, "text/*", "application/json", "image/*")
r.Use(compressor.Handler)
```

**Rule 2: Register custom HTTP methods sequentially during application initialization prior to routing.**

Always call `chi.RegisterMethod` during initial setup before starting the HTTP server or registering routes. Never invoke it dynamically from request handlers or concurrent goroutines to prevent data races and runtime crashes.

```go
func main() {
    chi.RegisterMethod("PURGE")
    r := chi.NewRouter()
    r.MethodFunc("PURGE", "/cache", handlePurge)
}
```

**Rule 3: Construct pass-through middleware functions that correctly invoke the next handler in the execution chain.**

Do not use `middleware.New` for wrapping pass-through middleware such as authentication or context injection, as it deliberately ignores downstream handlers and routes. Instead, write middleware functions that accept `next http.Handler` and explicitly call `next.ServeHTTP(w, r)`.

```go
func CustomAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !isValidUser(r) {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}
```


## Category: authentication

### Validate Authentication Credentials Before Setting Request Context

**Use when**

Developing authentication middleware to verify user identity before storing session or user state in the request context.

**Secure rules**

**Rule 1: Populate authentication state in the request context only after cryptographically validating session tokens, bearer tokens, or credentials, and never accept unvalidated inputs like URL query parameters.**

Authentication state must be strictly derived from verified credentials such as the `Authorization` header rather than untrusted query parameters. Use custom unexported types for context keys to prevent collisions, validate the incoming token or credentials securely, and pass the updated context down the request chain using `r.WithContext`.

```go
type contextKey string
const userCtxKey contextKey = "user.auth"

func AuthenticationMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("Authorization")
		user, err := validateToken(token)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		ctx := context.WithValue(r.Context(), userCtxKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
```


## Category: boundary control

### Configure ClientIPFromHeader with unconditionally overwritten proxy headers

**Use when**

Setting up boundary trust verification and client IP retrieval using middleware.ClientIPFromHeader in chi applications behind a reverse proxy.

**Secure rules**

**Rule 1: Select only HTTP header names that your reverse proxy unconditionally overwrites on every request when using middleware.ClientIPFromHeader.**

When configuring `middleware.ClientIPFromHeader`, ensure you only supply header names such as `X-Real-IP` or `CF-Connecting-IP` that are unconditionally overwritten by your edge proxy. Avoid pass-through headers like `True-Client-IP`, `X-Azure-ClientIP`, or `Fastly-Client-IP` unless your edge proxy explicitly strips inbound client-supplied values to prevent IP spoofing at the network boundary.

```go
r := chi.NewRouter()
r.Use(middleware.ClientIPFromHeader("X-Real-IP"))
```


## Category: input driven boundary selection

### Enforce explicit default fallback handlers in header-based routing

**Use when**

When routing middleware execution using `middleware.RouteHeaders()` to apply security checks or access controls based on untrusted request headers.

**Secure rules**

**Rule 1: Explicitly configure a default handler via RouteDefault when routing requests using RouteHeaders to prevent unmatched requests from bypassing security policies.**

When using `middleware.RouteHeaders()`, requests that do not match configured header patterns or `RouteAny` rules will silently fall through to downstream handlers unless a fallback is provided. You must explicitly declare a `RouteDefault` handler to enforce safe default-deny or fallback policies for unrecognized header values.

```go
hr := middleware.RouteHeaders().
	Route("Host", "api.example.com", apiMiddleware).
	RouteDefault(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, "Invalid Host Header", http.StatusBadRequest)
		})
	})
```

**Rule 2: Reject requests with unexpected header values in the RouteDefault handler.**

Ensure that the handler passed to `RouteDefault` explicitly handles or rejects requests failing header verification rather than allowing them to proceed unrestricted.


## Category: input interpretation safety

### Canonicalize and Sanitize Request Paths and Parameters

**Use when**

When building HTTP routers and handling URL parameters, path extensions, or request path normalization in Chi

**Secure rules**

**Rule 1: Apply `middleware.CleanPath` early on the top-level router to canonicalize request paths and remove duplicate slashes before route matching.**

Use `middleware.CleanPath` as early middleware on the root router to canonicalize request paths by removing duplicate slashes before route matching occurs. Ensure it is added at the top-level router before sub-routers or route definitions, as it only modifies `rctx.RoutePath` when it has not yet been set.

```go
r := chi.NewRouter()
r.Use(middleware.CleanPath)

r.Get("/users/{id}", getUserHandler)
```

**Rule 2: Sanitize wildcard route parameters to prevent path traversal.**

When extracting parameters from wildcard routes using `chi.URLParam(r, "*")`, explicitly clean and sanitize the resulting path prior to using it in file system access or downstream request forwarding.

```go
r := chi.NewRouter()

r.Get("/docs/*", func(w http.ResponseWriter, r *http.Request) {
	param := chi.URLParam(r, "*")
	cleanPath := filepath.Clean(param)
	if strings.HasPrefix(cleanPath, "..") || strings.Contains(cleanPath, "/..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
})
```


## Category: interface protocol hardening

### Enforce Strict HTTP Method Restrictions and Semantics

**Use when**

When registering endpoints and configuring routers to ensure requests strictly adhere to expected HTTP methods and protocol semantics.

**Secure rules**

**Rule 1: Use explicit HTTP method routing functions to restrict endpoints to expected methods.**

When defining endpoints, use HTTP method-specific routing functions such as `r.Get` and `r.Post` rather than generic catch-all handlers. Chi automatically responds with HTTP status 405 Method Not Allowed and populates the `Allow` header for requests using unhandled HTTP methods.

```go
r := chi.NewRouter()

// Explicitly register supported methods for the path
r.Get("/items", listItemsHandler)
r.Post("/items", createItemHandler)

// Unregistered methods (e.g., PUT /items) automatically receive HTTP 405
```


## Category: network boundary

### Configure explicit trusted proxy settings for client IP parsing

**Use when**

Setting up HTTP routers behind reverse proxies or load balancers where client IP addresses must be securely resolved without falling back to vulnerable default header parsing.

**Secure rules**

**Rule 1: Replace deprecated `RealIP` middleware with explicit `ClientIPFrom*` trust configurations tailored to your deployment topology.**

The legacy `RealIP` middleware was vulnerable to IP spoofing because it blindly trusted leftmost `X-Forwarded-For` headers. Instead, use explicit trust configurations such as `ClientIPFromXFF` with explicit CIDR ranges to ensure attacker-injected header values cannot bypass IP-based access controls or logging.

```go
r := chi.NewRouter()
r.Use(middleware.ClientIPFromXFF(
	"13.32.0.0/15",
	"2600:9000::/28",
))

r.Get("/profile", func(w http.ResponseWriter, r *http.Request) {
	clientIP := middleware.GetClientIP(r.Context())
	// Use clientIP for rate limiting or access control
})
```


## Category: resource exhaustion

### Limit Request Body Size and Concurrency for Resource-Heavy Endpoints

**Use when**

When building endpoints or route groups that accept client payloads or execute resource-intensive operations and require protection against resource exhaustion and Denial of Service.

**Secure rules**

**Rule 1: Apply request size limits and concurrency controls to prevent server resource exhaustion.**

Use `middleware.RequestSize` to restrict allowable request body sizes and prevent unconstrained payload reading. Additionally, apply `middleware.Throttle` or `middleware.ThrottleWithOpts` to establish capacity ceilings and manage concurrent in-flight requests on expensive or sensitive routes.

```go
r := chi.NewRouter()
r.With(middleware.RequestSize(1048576)).With(middleware.ThrottleWithOpts(middleware.ThrottleOpts{
	Limit:          50,
	BacklogLimit:   100,
	BacklogTimeout: 5 * time.Second,
	StatusCode:     http.StatusTooManyRequests,
	RetryAfterFn: func(ctxDone bool) time.Duration {
		return 10 * time.Second
	},
})).Post("/api/heavy-process", heavyHandler)
```


## Category: secret handling

### Exclude Sensitive Data from Request Query Parameters and Logs

**Use when**

When building HTTP endpoints and configuring logging middleware with chi to prevent plaintext exposure of secrets in request URIs.

**Secure rules**

**Rule 1: Avoid passing secrets, tokens, or personal identifiers in URL query strings where `middleware.Logger` or `DefaultLogFormatter` can capture them in logs.**

Transmit sensitive tokens via HTTP headers rather than query parameters so that plaintext credentials are not logged in standard output or log sinks by request logging middleware.

```go
// Transmit sensitive tokens via HTTP headers rather than query parameters
// BAD: GET /api/data?access_token=secret_key
// GOOD: Pass token in Authorization header

r := chi.NewRouter()
r.Use(middleware.Logger)

r.Get("/api/data", func(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	// Process request securely...
})
```


## Category: security control integrity

### Order Security Middlewares and Controls First in the Chi Router Pipeline

**Use when**

When registering global middleware, constructing middleware chains, or setting up routing middleware in Chi applications to ensure security mechanisms execute reliably.

**Secure rules**

**Rule 1: Register global security middleware before declaring routes on the router mux.**

Always add global middleware functions like authentication, rate-limiting, and logging via `r.Use(...)` prior to defining any routes or sub-routers. Chi enforces this ordering by design and will panic if `Mux.Use` is invoked after routes have already been configured.

```go
r := chi.NewRouter()
r.Use(middleware.Logger)
r.Use(AuthMiddleware)
r.Get("/protected", ProtectedHandler)
```

**Rule 2: Mount global security controls before SupressNotFound in the middleware stack.**

Ensure that mandatory security controls intended for all traffic, such as rate limiters and IP blockers, are mounted before `middleware.SupressNotFound` in the middleware chain. Placing `SupressNotFound` above security middleware causes unmapped requests to short-circuit and bypass those controls.

```go
r := chi.NewRouter()
r.Use(rateLimiterMiddleware)
r.Use(middleware.SupressNotFound(r))
r.Use(expensiveBusinessMiddleware)
```

**Rule 3: Position the Logger middleware before Recoverer in the router pipeline.**

Always register `middleware.Logger` before `middleware.Recoverer` so that a `LogEntry` is attached to the request context via `WithLogEntry`, allowing the recoverer middleware to successfully format and log panic stack traces.

```go
r := chi.NewRouter()
r.Use(middleware.Logger)
r.Use(middleware.Recoverer)
r.Get("/", func(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("ok"))
})
```
