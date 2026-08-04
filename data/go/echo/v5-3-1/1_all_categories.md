# Security cards

Repository: `https://github.com/labstack/echo#v5.3.1`

## Category: access control

### Verify Authentication Context Explicitly Before Processing Protected Requests

**Use when**

When building route handlers with middleware such as KeyAuth that allows requests to continue even when authentication fails or is absent.

**Secure rules**

**Rule 1: Verify whether the request is authenticated inside the route handler when using authentication middleware configured to continue on ignored errors.**

When `ContinueOnIgnoredError: true` is enabled in `KeyAuthConfig`, unauthenticated requests can reach downstream handlers if `ErrorHandler` returns `nil`. You must explicitly check whether the authentication context key exists before serving sensitive content or performing privileged actions.

```go
config := middleware.KeyAuthConfig{
	Validator: func(c *echo.Context, key string, source middleware.ExtractorSource) (bool, error) {
		if key == "valid-key" {
			c.Set("user", "authenticated_user")
			return true, nil
		}
		return false, nil
	},
	ErrorHandler: func(c *echo.Context, err error) error {
		return nil
	},
	ContinueOnIgnoredError: true,
}

e.GET("/resource", func(c *echo.Context) error {
	user := c.Get("user")
	if user == nil {
		return c.String(http.StatusOK, "Public content")
	}
	return c.String(http.StatusOK, "Secret user content")
}, middleware.KeyAuthWithConfig(config))
```


## Category: api contract misuse

### Configure Valid Redirect Status Codes for Protocol Compliance and URI Sanitization

**Use when**

Configuring redirect middleware or trailing slash handling where explicit HTTP redirect status codes must be provided to ensure protocol compliance and prevent open redirect vulnerabilities.

**Secure rules**

**Rule 1: Supply a valid HTTP status code within the 300-308 range when configuring redirect options or trailing slash middleware.**

When defining redirect configurations with `RedirectConfig` or trailing slash middleware, ensure the configured redirect code falls within the valid `300-308` range such as `http.StatusMovedPermanently` or `http.StatusPermanentRedirect`. Echo validates this range during middleware creation to ensure protocol compliance and properly sanitizes redirect URIs.

```go
e := echo.New()
e.Pre(middleware.AddTrailingSlashWithConfig(middleware.AddTrailingSlashConfig{
    RedirectCode: http.StatusMovedPermanently,
}))
```


### Properly Handle and Wrap Errors in Echo Middleware and Handlers

**Use when**

Use when writing custom error handlers, proxy middleware, or integrating authentication and rate-limiting middleware in Echo applications to prevent information disclosure, response commitment conflicts, and security control bypasses.

**Secure rules**

**Rule 1: Wrap low-level or internal errors using echo HTTP error methods to preserve error status codes and internal details securely.**

When returning HTTP errors in Echo handlers or custom middleware, construct errors using `echo.NewHTTPError(code, message)` or wrap underlying errors with `.Wrap(err)` or `fmt.Errorf` so that `echo.StatusCode(err)` correctly resolves status codes while keeping client-facing error messages sanitized.

```go
func HandleRequest(c *echo.Context) error {
	if err := performOperation(); err != nil {
		return echo.ErrInternalServerError.Wrap(err)
	}
	return c.NoContent(http.StatusOK)
}
```

**Rule 2: Verify response commitment status before writing error responses in centralized error handlers.**

Before attempting to write error status codes or payload frames in centralized error handlers or request loggers, check `c.Response().Committed` or `echo.UnwrapResponse(c.Response())` to ensure response headers have not already been sent to the client.

```go
e.HTTPErrorHandler = func(c *echo.Context, err error) {
	if r, _ := echo.UnwrapResponse(c.Response()); r != nil && r.Committed {
		return
	}
	_ = c.String(http.StatusInternalServerError, "Internal Error")
}
```

**Rule 3: Return allowed=false with a nil error when rejecting origins in UnsafeAllowOriginFunc**

When implementing `UnsafeAllowOriginFunc` inside `CORSConfig`, a non-nil error is returned immediately by the handler. To reject an unauthorized origin, return `allowed=false` with a nil error (as shown in the official example).

```go
config := middleware.CORSConfig{
    UnsafeAllowOriginFunc: func(c *echo.Context, origin string) (string, bool, error) {
        if strings.HasSuffix(origin, ".example.com") {
            return origin, true, nil
        }
        return "", false, nil
    },
}
```

**Rule 4: Prevent authentication and rate-limiting security bypasses when handling ignored or extraction errors.**

When configuring optional authentication or rate-limiting error handlers, ensure errors do not silently fail open or swallow critical security failures unless explicit fallback context state is assigned.

```go
middleware.KeyAuthConfig{
	Validator: validateKey,
	ErrorHandler: func(c *echo.Context, err error) error {
		c.Set("auth_role", "anonymous")
		return nil
	},
	ContinueOnIgnoredError: true,
}
```


## Category: authentication

### Use Constant-Time Comparison in Authentication Validators

**Use when**

Implementing custom validator callback functions for authentication middleware such as BasicAuth or KeyAuth to verify credentials securely.

**Secure rules**

**Rule 1: Use constant-time comparison functions when evaluating credentials inside validator callbacks.**

When implementing validator functions for `BasicAuth` or `KeyAuth`, always compare credentials using `crypto/subtle.ConstantTimeCompare` instead of standard Go string equality operators or switch statements. Standard string comparisons leak timing information via short-circuiting, allowing attackers to perform side-channel attacks and enumerate credentials character by character.

```go
import (
	"crypto/subtle"
	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
)

func secureKeyValidator(c *echo.Context, key string, source middleware.ExtractorSource) (bool, error) {
	validKey := "secret-api-key-12345"
	if subtle.ConstantTimeCompare([]byte(key), []byte(validKey)) == 1 {
		return true, nil
	}
	return false, nil
}
```


## Category: boundary control

### Register URL Rewrite Middleware Using Pre Instead Of Use

**Use when**

When registering URL rewrite middleware in Echo to ensure path transformations occur before route matching and route-level security enforcement.

**Secure rules**

**Rule 1: Register path rewriting middleware via `e.Pre()` rather than `e.Use()` so that request path modifications happen before route resolution and associated authorization checks.**

Using `e.Use()` causes Echo to resolve the route using the original request path prior to executing the rewrite logic, leading to potential security bypasses or handler mismatches. Always attach rewrite middleware using `e.Pre()`.

```go
e := echo.New()

// Register rewrite middleware using e.Pre() to rewrite the path before route resolution
e.Pre(middleware.RewriteWithConfig(middleware.RewriteConfig{
	Rules: map[string]string{
		"/old-path/*": "/new-path/$1",
	},
}))

e.GET("/new-path/*", func(c *echo.Context) error {
	return c.String(http.StatusOK, "Access Granted")
})
```


## Category: cryptography

### Generate Cryptographic Nonces Using Secure Random Sources

**Use when**

Generating custom security tokens, nonces, or secrets in application workflows.

**Secure rules**

**Rule 1: Derive security nonces and tokens directly from cryptographic random sources without modulo bias.**

When creating custom token generation routines or security nonces, pull entropy directly from `crypto/rand` using `io.ReadFull` rather than relying on weak pseudo-random sources. Handle any entropy source errors explicitly.

```go
bytes := make([]byte, 32)
if _, err := io.ReadFull(rand.Reader, bytes); err != nil {
    // Handle random reader failure
}
```


## Category: csrf

### Configure CSRF Cookie Attributes and Trusted Origins in Echo

**Use when**

Configuring CSRF middleware protection for web applications and REST APIs to prevent cross-site request forgery.

**Secure rules**

**Rule 1: Set secure cookie attributes for CSRF token protection.**

Explicitly configure `CookieSecure` to `true` when running over HTTPS, set `CookieHTTPOnly` to `true`, and define an appropriate `CookieSameSite` policy using `middleware.CSRFWithConfig`.

```go
app := echo.New()
app.Use(middleware.CSRFWithConfig(middleware.CSRFConfig{
    CookieSecure:   true,
    CookieHTTPOnly: true,
    CookieSameSite: http.SameSiteLaxMode,
}))
```

**Rule 2: Restrict trusted origins for CSRF validation.**

Explicitly define `TrustedOrigins` using exact scheme://host[:port] syntax to reject unauthorized cross-site requests.

```go
app := echo.New()
app.Use(middleware.CSRFWithConfig(middleware.CSRFConfig{
    TrustedOrigins: []string{"https://app.example.com"},
}))
```


## Category: file handling

### Safely serve static assets using Echo's built-in path resolution

**Use when**

Serving static files and assets through Echo middleware or route groups while preventing path traversal vulnerabilities.

**Secure rules**

**Rule 1: Rely on Echo's built-in file path resolution and static middleware configuration without manually unescaping request URL paths.**

When serving static assets using `StaticWithConfig` or group-level `Static` methods, rely on Echo's built-in file path resolution rather than performing manual path unescaping or custom string concatenation. Echo's static middleware automatically sanitizes and rejects path traversal variants like backslashes, percent-encoded sequences, and mixed slashes. Avoid manual decoding of `c.Request().URL.Path` before performing filesystem lookups.

```go
e := echo.New()
e.Use(middleware.StaticWithConfig(middleware.StaticConfig{
	Root:       "public",
	Filesystem: os.DirFS("dist"),
}))
```

**Rule 2: Keep directory browsing disabled in production environments.**

Keep the `Browse` field in `StaticConfig` set to `false` unless directory index listing is explicitly intended for public consumption. Do not enable browsing on sensitivity-restricted or internal file structures to prevent full directory content disclosure and potential information leaks.

```go
e := echo.New()
// Secure default: Browse is false
e.Use(middleware.StaticWithConfig(middleware.StaticConfig{
    Root:   "public",
    Browse: false, // Ensure browsing remains disabled in production
}))
```


## Category: input contract definition

### Validate Request Input and Enforce Input Contracts

**Use when**

Use when binding request payloads, query parameters, path variables, or form data to ensure untrusted input conforms to required types, structures, and value boundaries before executing handler logic.

**Secure rules**

**Rule 1: Register a custom validator and explicitly invoke validation after binding request data.**

Implement the `echo.Validator` interface and assign it to the Echo instance using `echo.NewWithConfig` or `e.Validator`. Because Echo does not automatically execute validation during `c.Bind(i)`, developers must explicitly call `c.Validate(i)` on bound struct pointers and catch any returned validation errors.

```go
type CustomValidator struct {
	validator *validator.Validate
}

func (cv *CustomValidator) Validate(i any) error {
	return cv.validator.Struct(i)
}

e := echo.NewWithConfig(echo.Config{
	Validator: &CustomValidator{validator: validator.New()},
})

func createUserHandler(c *echo.Context) error {
	req := new(CreateUserRequest)
	if err := c.Bind(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	if err := c.Validate(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusOK, req)
}
```

**Rule 2: Enforce typed parameter binding and mandatory input constraints.**

Use typed parameter binding helpers such as `echo.QueryParam[T](c, name)` and `QueryParamsBinder` with `Must<Type>` methods to enforce strict type constraints and required parameter presence. Always check and evaluate `BindError()` or binding error returns immediately to prevent malformed or missing parameters from silently defaulting to zero-values.

```go
var userID int64
err := echo.QueryParamsBinder(c).
    MustInt64("user_id", &userID).
    BindError()

if err != nil {
    return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid request parameters"})
}

val, err := echo.QueryParam[string](c, "key")
if err != nil {
    return echo.NewHTTPError(http.StatusBadRequest, "invalid query parameter")
}
```

**Rule 3: Use single-source binding functions to prevent request parameter override.**

Avoid default binder sequential evaluation when struct tags overlap across different request sources. Use dedicated single-source binding functions like `echo.BindPathValues`, `echo.BindQueryParams`, or `echo.BindBody` to maintain strict parameter origin boundaries.

```go
var pathData PathParams
if err := echo.BindPathValues(c, &pathData); err != nil {
    return err
}
var bodyData BodyParams
if err := echo.BindBody(c, &bodyData); err != nil {
    return err
}
```


## Category: input interpretation safety

### Configure Secure CORS Origins and Dynamic Origin Validation

**Use when**

Configuring cross-origin resource sharing for Echo web applications using explicit allow lists or dynamic origin callback validation.

**Secure rules**

**Rule 1: Ensure allowed origins include explicit schemes and hostnames.**

Echo's CORS middleware validates origin strings during initialization and rejects configuration entries in `AllowOrigins` that lack an explicit URL scheme such as `http://` or `https://`. Origin matching strictly enforces exact scheme matching during preflight and request evaluation, treating different schemes as distinct origins.

```go
e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
	AllowOrigins: []string{"https://example.com", "https://api.example.com"},
}))
```

**Rule 2: Use UnsafeAllowOriginFunc for secure dynamic subdomain origin validation.**

When dynamic cross-origin validation is required with credentials, configure `UnsafeAllowOriginFunc` in `CORSConfig`. Perform strict scheme, host, and port matching rather than weak string suffix or prefix checks to prevent attacker-registered domains from bypassing CORS restrictions.

```go
e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
	UnsafeAllowOriginFunc: func(c *echo.Context, origin string) (string, bool, error) {
		if origin == "https://trusted.example.com" || origin == "https://api.example.com" {
			return origin, true, nil
		}
		return "", false, nil
	},
	AllowCredentials: true,
}))
```


### Normalize URL paths and handle encoded characters during routing and rewrites

**Use when**

When registering pre-routing slash middleware or defining URL rewrite rules in Echo applications where input path representation variations could cause routing bypasses or parsing differentials.

**Secure rules**

**Rule 1: Register path normalization middleware using e.Pre() to process requests before routing decisions.**

Always register `AddTrailingSlash` or `RemoveTrailingSlash` middleware using `e.Pre()` rather than `e.Use()`. Pre-routing registration ensures that URL path normalization occurs before Echo matches routes, establishing a single unambiguous path interpretation.

```go
e := echo.New()
e.Pre(middleware.AddTrailingSlash())
```

**Rule 2: Account for URL encoding variations in custom rewrite rules to prevent parser bypasses.**

When defining regex-based URL rewrite rules in Echo middleware, ensure rules account for URL encoding variations or canonical paths. Encoded path characters in request URLs will not match literal regex patterns designed for unencoded paths, which can lead to routing mismatches and policy bypasses.

```go
e.Use(middleware.Rewrite(map[*regexp.Regexp]string{
	regexp.MustCompile("^/users/(.*?)/orders/(.*?)$"): "/user/$1/order/$2",
}))
```


## Category: interface protocol hardening

### Configure HTTP Response Security Headers Using Echo Middleware and Predefined Constants

**Use when**

Setting up response security headers like Content-Security-Policy, HSTS, X-Frame-Options, and X-Content-Type-Options in Echo handlers or middleware.

**Secure rules**

**Rule 1: Use Echo's `middleware.Secure()` or `middleware.SecureWithConfig()` to set essential HTTP security response headers.**

Configure `SecureConfig` options such as `XSSProtection`, `ContentTypeNosniff`, `XFrameOptions`, `HSTSMaxAge`, `ContentSecurityPolicy`, and `ReferrerPolicy` to protect applications against clickjacking, MIME-sniffing, transport downgrade attacks, and content injection.

```go
e := echo.New()

e.Use(middleware.SecureWithConfig(middleware.SecureConfig{
	XSSProtection:         "1; mode=block",
	ContentTypeNosniff:    "nosniff",
	XFrameOptions:         "SAMEORIGIN",
	HSTSMaxAge:            31536000,
	HSTSPreloadEnabled:    true,
	HSTSExcludeSubdomains: false,
	ContentSecurityPolicy: "default-src 'self'",
	ReferrerPolicy:        "strict-origin-when-cross-origin",
}))
```


### Restrict HTTP Method Overrides to Header-Based Configurations

**Use when**

When configuring method overriding behavior for HTTP requests in Echo applications to prevent unintended state-changing actions via forged parameters or query strings.

**Secure rules**

**Rule 1: Restrict HTTP method overrides to POST requests using the MethodOverride middleware with its default header-based configuration**

The MethodOverride middleware only permits an HTTP method to be overridden when the original request method is POST (for security reasons). Prefer the default configuration, which obtains the override value from the `X-HTTP-Method-Override` header via `MethodFromHeader`. Register the middleware with `Pre` so that the overridden method is visible to the router.

```go
e := echo.New()
e.Pre(middleware.MethodOverride())

// Alternatively, configure explicitly using the header-based getter:
e.Pre(middleware.MethodOverrideWithConfig(middleware.MethodOverrideConfig{
    Getter: middleware.MethodFromHeader(echo.HeaderXHTTPMethodOverride),
}))
```


## Category: network boundary

### Configure Explicit IPExtractor to Prevent Upstream IP Spoofing

**Use when**

Setting up proxy middleware or handling client IP addresses in Echo to prevent spoofing of X-Real-IP and X-Forwarded-For headers.

**Secure rules**

**Rule 1: Configure an explicit `e.IPExtractor` on the Echo instance before using proxy or remote IP functionality.**

To ensure upstream targets receive verified client IP addresses, developers must explicitly define `e.IPExtractor` on the Echo instance before attaching Proxy middleware.

```go
e := echo.New()
e.IPExtractor = echo.ExtractIPFromXFFHeader()

e.Use(middleware.Proxy(middleware.NewRoundRobinBalancer([]*middleware.ProxyTarget{
    { Name: "backend", URL: targetURL },
})))
```


## Category: resource exhaustion

### Configure Request Size, Payload Limits, and Timeouts to Prevent Resource Exhaustion

**Use when**

Developing Echo web applications and handling incoming HTTP requests, multipart forms, compressed payloads, or long-running tasks.

**Secure rules**

**Rule 1: Limit request body sizes using BodyLimit middleware**

Configure Echo's `middleware.BodyLimit` or `middleware.BodyLimitWithConfig` on endpoints that process incoming request bodies to prevent memory exhaustion and denial-of-service attacks.

```go
e := echo.New()
e.Use(middleware.BodyLimit(2 * 1024 * 1024))
```

**Rule 2: Limit decompressed request payload size to prevent zip bomb DoS**

When enabling request decompression using Echo's Decompress middleware, ensure that `MaxDecompressedSize` is set to an appropriate limit for your application rather than disabled.

```go
e.Use(middleware.DecompressWithConfig(middleware.DecompressConfig{
	MaxDecompressedSize: 10 * 1024 * 1024,
}))
```

**Rule 3: Set request timeouts using ContextTimeout middleware**

Configure `middleware.ContextTimeout` or `middleware.ContextTimeoutWithConfig` with a positive duration to set strict execution deadlines on incoming requests and ensure backend operations respect context cancellation.

```go
e.Use(middleware.ContextTimeout(5 * time.Second))

e.GET("/items", func(c *echo.Context) error {
	items, err := repository.FindAll(c.Request().Context())
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, items)
})
```

**Rule 4: Configure HTTP server timeouts using BeforeServeFunc**

Use `BeforeServeFunc` to explicitly configure `ReadHeaderTimeout`, `WriteTimeout`, `IdleTimeout`, and `MaxHeaderBytes` on the underlying `http.Server` instance before listening.

```go
sc := echo.StartConfig{
	Address: ":8080",
	BeforeServeFunc: func(s *http.Server) error {
		s.ReadHeaderTimeout = 10 * time.Second
		s.WriteTimeout = 30 * time.Second
		s.IdleTimeout = 2 * time.Minute
		s.MaxHeaderBytes = 1 << 20
		return nil
	},
}
err := sc.Start(ctx, e)
```

**Rule 5: Configure multipart form parse memory limits explicitly**

Tune `formParseMaxMemory` on your Echo instance to align with server resource constraints when handling file uploads or large forms.

```go
e := echo.New()
e.SetFormParseMaxMemory(4 << 20)
```

**Rule 6: Configure RateLimiter middleware store and burst limits to prevent resource exhaustion**

Explicitly specify a `RateLimiterStore` such as `NewRateLimiterMemoryStoreWithConfig` with appropriate `Rate`, `Burst`, and `ExpiresIn` settings when configuring Echo's `RateLimiter` middleware.

```go
store := middleware.NewRateLimiterMemoryStoreWithConfig(middleware.RateLimiterMemoryStoreConfig{
	Rate:      10,
	Burst:     30,
	ExpiresIn: 3 * time.Minute,
})

e.Use(middleware.RateLimiterWithConfig(middleware.RateLimiterConfig{
	Store: store,
}))
```


## Category: runtime environment hardening

### Disable detailed error exposure in production error handlers

**Use when**

Configuring Echo's HTTP error handling and runtime environment parameters for production deployments.

**Secure rules**

**Rule 1: Configure Echo's HTTP error handler to disable raw error exposure in production environments.**

Set `exposeError` to false when configuring the default HTTP error handler via `echo.DefaultHTTPErrorHandler(false)` using `echo.NewWithConfig`. This prevents sensitive implementation details, internal paths, and database errors from leaking to untrusted clients in production JSON responses.

```go
e := echo.NewWithConfig(echo.Config{
	HTTPErrorHandler: echo.DefaultHTTPErrorHandler(false),
})
```


### Prevent application crashes and process termination from runtime panics

**Use when**

Configuring the production runtime and middleware stack to protect the server process from unhandled panics and potential denial-of-service impacts.

**Secure rules**

**Rule 1: Register the Recover middleware to intercept runtime panics during request handling.**

Add `middleware.Recover()` near the top of the middleware stack so all route handlers and subsequent middleware are wrapped, preventing unhandled panics from crashing the web server process.

```go
e := echo.New()
e.Use(middleware.Recover())
```


## Category: secret handling

### Redact Secrets from Request Logs and Body Dumps

**Use when**

When configuring HTTP request loggers or body dump handlers in Echo to prevent sensitive data such as tokens, passwords, and private parameters from being written to logs.

**Secure rules**

**Rule 1: Sanitize and redact sensitive body payloads before logging or persisting them.**

Implement data redaction routines inside the `BodyDumpHandler` callback to sanitize captured request and response byte slices before logging or transmitting them.

```go
e.Use(middleware.BodyDump(func(c *echo.Context, reqBody []byte, resBody []byte, err error) {
	sanitizedReq := redactSensitiveData(reqBody)
	sanitizedRes := redactSensitiveData(resBody)
	slog.Info("http dump", "path", c.Path(), "req", sanitizedReq, "res", sanitizedRes)
}))
```
