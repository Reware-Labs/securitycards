# Security cards

Repository: `https://github.com/gofiber/fiber#v3.4.0`

## Category: access control

### Enforce Early Return on Authorization Failure in Middleware

**Use when**

Implementing authentication or access control middleware in a Fiber route chain to protect endpoints against unauthorized access.

**Secure rules**

**Rule 1: Abort middleware execution immediately upon authorization failure without calling c.Next()**

When checking access control in a Fiber middleware handler, ensure that failing the check returns an error or a status response directly without invoking `c.Next()`. Calling `c.Next()` after a failed check allows control to flow into downstream handlers and bypasses security protections.

```go
app.Get("/protected/resource",
    func(c fiber.Ctx) error {
        if c.Get("Authorization") == "" {
            return c.SendStatus(fiber.StatusUnauthorized)
        }
        return c.Next()
    },
    func(c fiber.Ctx) error {
        return c.SendString("Sensitive data")
    },
)
```


## Category: api contract misuse

### Properly Handle Binding Errors and Return Errors from Binding Methods

**Use when**

Parsing and binding incoming request data using `c.Bind()`.

**Secure rules**

**Rule 1: Inspect binding errors using `errors.As` and `*fiber.BindError` to safely extract fields without leaking internal backend traces.**

Always check for `*fiber.BindError` when handling binding failures so you can inspect `be.Field` and `be.Source` safely.

```go
app.Post("/data", func(c fiber.Ctx) error {
    req := new(DataRequest)
    if err := c.Bind().Body(req); err != nil {
        var be *fiber.BindError
        if errors.As(err, &be) {
            return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
                "error": "validation_failed",
                "field": be.Field,
                "source": be.Source.String(),
            })
        }
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid input"})
    }
    return c.SendStatus(fiber.StatusOK)
})
```

**Rule 2: Always explicitly return errors returned by Fiber binding methods.**

Even when auto-handling is enabled via `WithAutoHandling()`, you must explicitly return the error to abort handler execution and prevent processing with unpopulated structs.

```go
app.Post("/profile", func(c fiber.Ctx) error {
	var req UpdateProfileReq
	if err := c.Bind().WithAutoHandling().JSON(&req); err != nil {
		return err
	}
	return c.SendString("Updated")
})
```


## Category: authentication

### Implement secure authentication and credential verification in Fiber middleware

**Use when**

When configuring authentication mechanisms such as basic authentication or key-based token validation in Fiber applications.

**Secure rules**

**Rule 1: Provide a non-nil Validator function and use constant-time comparison for API keys**

When configuring `keyauth.New`, always supply a valid `Validator` function and use `subtle.ConstantTimeCompare` to evaluate API keys against expected values, preventing side-channel timing attacks.

```go
app.Use(keyauth.New(keyauth.Config{
    Validator: func(c fiber.Ctx, key string) (bool, error) {
        hashedKey := crypto.SHA256([]byte(key))
        return subtle.ConstantTimeCompare(hashedKey, expectedHashedKey) == 1, nil
    },
}))
```

**Rule 2: Use secure password hashes and constant-time comparisons in basic authentication**

Configure `basicauth.New` with bcrypt password hashes or an authorizer using constant-time comparison functions to protect stored credentials against offline brute-force and timing attacks.

```go
app.Use(basicauth.New(basicauth.Config{
    Users: map[string]string{
        "admin": "$2a$10$vI8aWBnW3fID.ZQ4/07.e.e1cTfE2wG8Pz6A0ZqYh123456789012",
    },
}))
```


## Category: boundary control

### Provide a fallback URL when redirecting back

**Use when**

When implementing HTTP redirection back to the originating request context using `c.Redirect().Back()`.

**Secure rules**

**Rule 1: Pass a safe internal fallback URL as an argument to Back() to handle missing or cross-origin referrers securely.**

When calling `c.Redirect().Back()`, always provide a fallback route parameter to prevent unhandled `ErrRedirectBackNoFallback` errors and control the application boundary transition when the `Referer` header is absent or invalid.

```go
app.Post("/profile", func(c fiber.Ctx) error {
    // Safely redirect back to referer if same-origin, fallback to "/dashboard"
    return c.Redirect().Back("/dashboard")
})
```


## Category: configuration source integrity

### Configure explicit and non-conflicting TLS certificate sources in ListenConfig

**Use when**

Configuring server TLS parameters and certificate management options in ListenConfig to ensure deterministic and unambiguous security configuration precedence.

**Secure rules**

**Rule 1: Avoid mixing AutoCertManager with manual certificate file paths or conflicting TLS configurations in ListenConfig.**

Use a single, unambiguous source for TLS credentials in ListenConfig to prevent initialization failures or precedence overrides. Providing an explicit TLSConfig object takes precedence and causes Fiber to ignore separate CertFile settings and TLSConfigFunc callbacks, and mixing AutoCertManager with manual paths results in errors like ErrAutoCertWithCertFile.

```go
err := app.Listen(":443", fiber.ListenConfig{
    AutoCertManager: &autocert.Manager{
        Prompt:     autocert.AcceptTOS,
        HostPolicy: autocert.HostWhitelist("example.com"),
    },
})
```

**Rule 2: Ensure security-sensitive configuration sources have deterministic precedence.**

Define explicit precedence for TLS settings and reject unexpected overrides or mixing of conflicting configuration mechanisms in ListenConfig.


## Category: csrf

### Configure CSRF Protection and Secure Token Handling in Fiber

**Use when**

When protecting state-changing routes against cross-site request forgery using Fiber's CSRF middleware and extractors.

**Secure rules**

**Rule 1: Configure CSRF middleware with secure cookie attributes and appropriate token extractors.**

Set `CookieSecure`, `CookieHTTPOnly`, and `CookieSameSite` properties securely, and utilize header or form extractors instead of URL parameters to prevent token leakage.

```go
app.Use(csrf.New(csrf.Config{
    CookieName:        "__Host-csrf_",
    CookieSecure:      true,
    CookieHTTPOnly:    true,
    CookieSameSite:    "Lax",
    CookieSessionOnly: true,
    Extractor:         extractors.FromHeader("X-Csrf-Token"),
    Session:           sessionStore,
}))
```

**Rule 2: Invalidate tokens upon session termination and configure single-use lifetimes.**

Enable `SingleUseToken` and set an explicit `IdleTimeout` to prevent token replay attacks, and call `handler.DeleteToken(c)` during logout or session destruction.

```go
app.Use(csrf.New(csrf.Config{
    SingleUseToken: true,
    IdleTimeout:    15 * time.Minute,
}))
```


## Category: escape hatch

### Avoid Unsafe Reflection and Memory Manipulation in Context Adaptors

**Use when**

Integrating net/http handlers with Fiber and propagating request context.

**Secure rules**

**Rule 1: Avoid adaptor.CopyContextToFiberContext to prevent unsafe memory mutation and reflection usage.**

Use safe context propagation wrappers such as adaptor.HTTPHandlerWithContext and LocalContextFromHTTPRequest rather than mutating request contexts via reflection.

```go
app.Get("/hello", adaptor.HTTPHandlerWithContext(http.HandlerFunc(handleRequest)))

func handleRequest(w http.ResponseWriter, r *http.Request) {
    ctx, ok := adaptor.LocalContextFromHTTPRequest(r)
    if !ok || ctx == nil {
        http.Error(w, "missing context", http.StatusInternalServerError)
        return
    }
}
```


## Category: file handling

### Sanitize and Validate File Paths for Downloads and Access

**Use when**

Handling user input to serve or access files via `c.Download()`, `c.SendFile()`, or custom path resolution.

**Secure rules**

**Rule 1: Verify that user-influenced file paths remain inside the authorized base directory.**

Always clean and check path variables using functions like `filepath.Clean()` and `filepath.Rel()` or prefix validation before passing them to file handling methods. Relying solely on `filepath.Clean()` or basic wrappers is insufficient to prevent path traversal outside the safe root directory.

```go
baseDir := "/var/www/uploads"
userInput := c.Params("filename")
cleanPath := filepath.Clean(filepath.Join(baseDir, filepath.Base(userInput)))

if !strings.HasPrefix(cleanPath, baseDir) {
    return c.Status(fiber.StatusForbidden).SendString("Invalid file path")
}

return c.Download(cleanPath)
```


## Category: injection

### Validate Dynamic Sort Parameters Using an Allowlist

**Use when**

When accepting dynamic sort parameters from user-driven query strings for database sorting in Fiber applications.

**Secure rules**

**Rule 1: Explicitly configure allowed sort fields using an allowlist to prevent arbitrary or unsafe column ordering.**

Specify allowed sort fields within `paginate.Config` to restrict user input to known safe database column names and prevent exposure of internal table structures or injection risks.

```go
app.Use(paginate.New(paginate.Config{
    SortKey:      "sort",
    DefaultSort:  "created_at",
    AllowedSorts: []string{"id", "name", "created_at"},
}))
```


## Category: input contract definition

### Enforce Input Validation Contracts During Request Binding in Fiber

**Use when**

Use when binding and validating incoming request parameters, query strings, headers, or body payloads to ensure input conforms to expected types, structures, and required field criteria before processing.

**Secure rules**

**Rule 1: Declare explicit required struct tags and validate binding errors to prevent zero-value bypasses.**

Explicitly declare the required tag option on struct fields when binding request inputs via `c.Bind()`. Always validate the return error of `c.Bind()` operations before relying on bound struct values to ensure missing or malformed parameters are rejected.

```go
type UserQuery struct {
    UserID int    `query:"user_id,required"`
    Role   string `query:"role"`
}

app.Get("/user", func(c fiber.Ctx) error {
    q := new(UserQuery)
    if err := c.Bind().Query(q); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing required user_id parameter"})
    }
    return c.SendString(fmt.Sprintf("User ID: %d", q.UserID))
})
```

**Rule 2: Configure a struct validator on the Fiber app instance for automatic input validation.**

Fiber automatically invokes `app.config.StructValidator` on destination structs after binding request parameters unless `SkipValidation(true)` is called on the binder chain. Configure an implementation of `StructValidator` on the Fiber application instance to enforce input validation contracts across bound structs.

```go
type CustomValidator struct{}

func (v *CustomValidator) Validate(out any) error {
	// Execute validator logic (e.g. using go-playground/validator)
	return nil
}

app := fiber.New(fiber.Config{
	StructValidator: &CustomValidator{},
})
```


## Category: input driven boundary selection

### Validate Dynamic Redirect Targets Against Approved Internal Boundaries

**Use when**

Handling user-supplied query parameters or HTTP headers to determine redirect destinations in Fiber route handlers.

**Secure rules**

**Rule 1: Validate and constrain untrusted redirect targets to relative paths before calling redirect methods.**

When calling `c.Redirect().To()` with dynamic input or reading the client-controlled `Referer` header via `c.Redirect().Back()`, strictly validate that the target URL is a relative path and does not contain protocol-relative prefixes to prevent open redirect vulnerabilities.

```go
app.Get("/redirect", func(c fiber.Ctx) error {
    target := c.Query("next", "/")
    if !strings.HasPrefix(target, "/") || strings.HasPrefix(target, "//") {
        target = "/"
    }
    return c.Redirect().To(target)
})
```


## Category: input interpretation safety

### Control URL path unescaping and parameter binding sources to prevent parsing ambiguity

**Use when**

When configuring application routing paths or binding request parameters where inconsistent decoding or ambiguous parameter origins could lead to alternate interpretations.

**Secure rules**

**Rule 1: Leave `UnescapePath` disabled unless routes require decoded URL-encoded characters**

`UnescapePath` defaults to `false`. When enabled, Fiber decodes encoded characters before route matching and exposes the decoded values through the request path and route parameters. Keep the default setting when the application does not require routes to match URL-encoded special characters.

```go
app := fiber.New(fiber.Config{
	UnescapePath: false,
})
```

**Rule 2: Use explicit binding methods instead of binding all sources when strict parameter origin is required.**

Avoid using `b.All()` when parameter values must come from a designated request source, as it sequentially falls back across URI parameters, request bodies, query parameters, headers, and cookies.

```go
app.Post("/users", func(c fiber.Ctx) error {
	var req CreateUserRequest
	// Use explicit JSON binding to ensure parameters are read only from body
	if err := c.Bind().JSON(&req); err != nil {
		return err
	}
	return c.JSON(req)
})
```


## Category: interface protocol hardening

### Restrict HTTP methods and content types to enforce protocol boundaries

**Use when**

When configuring Fiber application routing, global configurations, and middleware to process incoming HTTP requests strictly according to expected methods and content semantics.

**Secure rules**

**Rule 1: Enable GETOnly mode on read-only services to strictly reject non-GET requests and enforce protocol boundaries.**

Enable `GETOnly` inside `fiber.Config` on read-only microservices to ensure the application automatically rejects state-changing HTTP methods and maintains strict network protocol boundaries.

```go
app := fiber.New(fiber.Config{
    GETOnly: true,
})
```

**Rule 2: Restrict state modifications exclusively to unsafe HTTP methods and keep safe methods read-only.**

Do not perform state-changing operations inside handlers bound to HTTP methods classified as safe, such as `GET`, `HEAD`, `OPTIONS`, `TRACE`, and `QUERY`, because mechanisms like CSRF token validation and early data rejection bypass safety checks for these methods.

```go
app.Post("/user/update", func(c fiber.Ctx) error {
    return c.SendStatus(fiber.StatusOK)
})

app.Query("/items", func(c fiber.Ctx) error {
    return c.JSON(items)
})
```


## Category: memory safety

### Prevent Memory Corruption and Data Races by Copying Pooled Context and Buffer References

**Use when**

When handling requests, passing context values or header slices to background goroutines, or retaining parsed data beyond request handler execution in Fiber.

**Secure rules**

**Rule 1: Avoid passing pooled fiber context or raw header slices to asynchronous goroutines without copying.**

Because Fiber context instances and request/response buffers are pooled and recycled across requests, passing `fiber.Ctx` or raw header slices directly into background goroutines causes data races and memory corruption. Obtain a standalone Go context using `c.Context()` or `c.SetContext()`, or explicitly copy string and byte slice references before retaining them outside the handler lifecycle.

```go
app.Get("/async", func(c fiber.Ctx) error {
  ctx := c.Context()
  go func(ctx context.Context) {
    doBackgroundWork(ctx)
  }(ctx)
  return c.SendStatus(fiber.StatusAccepted)
})
```


## Category: network boundary

### Configure Trusted Proxy Ranges and Host Authorization to Secure Network Boundaries

**Use when**

When deploying Fiber applications behind reverse proxies, load balancers, or when configuring server network and transport security settings.

**Secure rules**

**Rule 1: Explicitly configure trusted proxy IP addresses and header settings when enabling proxy trust.**

Always set `TrustProxy` to true and define explicit IP addresses or network CIDR ranges in `TrustProxyConfig.Proxies` to prevent untrusted clients from spoofing IP addresses, schemes, and hostnames.

```go
app := fiber.New(fiber.Config{
    TrustProxy: true,
    TrustProxyConfig: fiber.TrustProxyConfig{
        Proxies: []string{"10.0.0.0/8", "192.168.1.100"},
        Private: true,
    },
})
```

**Rule 2: Validate incoming Host headers using host authorization middleware.**

Configure `hostauthorization` middleware with explicit allowed hosts or domain lists to protect against DNS rebinding and host header injection attacks.

```go
app.Use(hostauthorization.New(hostauthorization.Config{
    AllowedHosts: []string{"example.com", "*.example.com"},
}))
```

**Rule 3: Enforce TLS encryption on server and client connections.**

Secure server-to-server and client communication by configuring TLS certificates on the Fiber server via `fiber.ListenConfig` and binding trusted CA certificates using `SetTLSConfig` on the Fiber HTTP client.

```go
err := app.Listen(":3000", fiber.ListenConfig{
    CertFile:    "ssl.cert",
    CertKeyFile: "ssl.key",
})

cc := client.New()
cc.SetTLSConfig(&tls.Config{
    RootCAs: certPool,
})
```


## Category: output encoding

### URL encode untrusted query parameters when configuring route redirects

**Use when**

When populating `RedirectConfig.Queries` with untrusted data for `c.Redirect().Route()` in Fiber applications.

**Secure rules**

**Rule 1: URL-encode untrusted parameter keys and values using `url.QueryEscape` before inserting them into redirect query configurations.**

Because Fiber appends query map keys and values directly without automatic URL escaping for performance reasons, developers must manually encode untrusted data using `url.QueryEscape` to prevent HTTP parameter injection or malformed URL structures.

```go
app.Get("/search-redirect", func(c fiber.Ctx) error {
    query := c.Query("q")
    return c.Redirect().Route("search.results", fiber.RedirectConfig{
        Queries: map[string]string{
            "q": url.QueryEscape(query),
        },
    })
})
```


## Category: resource exhaustion

### Configure Request Body Limits and Timeouts to Prevent Resource Exhaustion

**Use when**

When initializing Fiber applications and handling incoming HTTP requests or background operations that require strict bounds on payload size and execution time.

**Secure rules**

**Rule 1: Configure an explicit BodyLimit in fiber.Config to restrict incoming request payload sizes.**

Define `BodyLimit` when initializing Fiber with `fiber.New()` to restrict maximum request payload sizes, protecting your server against memory and disk space exhaustion. Requests exceeding this limit receive an HTTP 413 error status.

```go
app := fiber.New(fiber.Config{
    BodyLimit: 2 * 1024 * 1024, // Restrict maximum payload size to 2MB
})
```

**Rule 2: Enforce request deadlines using explicit context timeouts on long-running tasks.**

Wrap handler contexts with `context.WithTimeout` and monitor `ctx.Done()` to cancel lingering background operations and prevent resource exhaustion when handling requests in Fiber.

```go
app.Get("/job", func(c fiber.Ctx) error {
    ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
    defer cancel()
    if err := doWork(ctx); err != nil {
        return c.Status(fiber.StatusGatewayTimeout).SendString("timeout")
    }
    return c.SendStatus(fiber.StatusOK)
})
```


### Enable Response Body Streaming and Shared Storage for Clients and Rate Limiting

**Use when**

When building applications that download large payloads using Fiber's HTTP client or enforce distributed rate limiting across multiple server instances.

**Secure rules**

**Rule 1: Enable response body streaming when handling large HTTP client responses.**

Set `SetStreamResponseBody(true)` on the HTTP client and consume responses incrementally via `resp.BodyStream()` to prevent loading large payloads entirely into memory, ensuring you call `defer resp.Close()` afterwards.

```go
cc := client.New()
cc.SetStreamResponseBody(true)

resp, err := cc.Get("https://example.com/large-file")
if err != nil {
    return err
}
defer resp.Close()

if resp.IsStreaming() {
    reader := resp.BodyStream()
    buf := make([]byte, 4096)
    for {
        n, err := reader.Read(buf)
        if n > 0 {
            // Process chunk safely
        }
        if err == io.EOF {
            break
        }
        if err != nil {
            return err
        }
    }
}
```

**Rule 2: Configure Shared Storage for Multi-Process Rate Limiting.**

Assign a centralized backend such as Redis or Memcached to the `Storage` field in `limiter.Config` when deploying applications across multiple server instances to prevent clients from bypassing local in-memory rate limits.

```go
app.Use(limiter.New(limiter.Config{
    Max:        20,
    Expiration: 30 * time.Second,
    Storage:    customRedisStorage,
}))
```


## Category: runtime environment hardening

### Isolate Prefork Application Instances in Dedicated Environments

**Use when**

Configuring Fiber runtime execution mode for production deployment to manage socket reuse and process isolation.

**Secure rules**

**Rule 1: Isolate prefork worker processes under dedicated service identities in restricted runtime boundaries or disable prefork for single-owner socket semantics.**

When deploying Fiber in production, avoid running prefork mode in shared-host or untrusted multi-tenant environments where local processes share network namespaces. If strict single-owner socket semantics are required, initialize Fiber normally without prefork flags.

```go
package main

import (
	"log"
	"github.com/gofiber/fiber/v3"
)

func main() {
	app := fiber.New()

	app.Get("/api/health", func(c fiber.Ctx) error {
		return c.SendString("OK")
	})

	// Standard single-process server start
	log.Fatal(app.Listen(":8080"))
}
```


### Keep CSRF Value Redaction Enabled in Production

**Use when**

Configuring CSRF middleware options for production deployment where diagnostic logging and error messages are active.

**Secure rules**

**Rule 1: Ensure `DisableValueRedaction` remains `false` in production to prevent sensitive tokens and storage keys from leaking in logs.**

Do not leave default development configurations or enable diagnostic value un-redaction (`DisableValueRedaction: true`) in production environments. Ensure `DisableValueRedaction` remains `false` so sensitive CSRF tokens and backend storage keys are properly redacted in error messages and diagnostic logs, preventing attackers from exploiting exposed tokens.

```go
app.Use(csrf.New(csrf.Config{
    CookieName:        "__Host-csrf_",
    CookieSecure:      true,
    CookieHTTPOnly:    true,
    CookieSameSite:    "Lax",
    CookieSessionOnly: true,
    Extractor:         extractors.FromHeader("X-Csrf-Token"),
    Session:           sessionStore,
    DisableValueRedaction: false,
}))
```


## Category: secret handling

### Enforce value redaction and secure secret configuration in middleware

**Use when**

Configuring encryption keys and ensuring proper value redaction in Fiber middleware components.

**Secure rules**

**Rule 1: Supply a stable base64 encoded secret key for cookie encryption**

Supply a stable, base64-encoded string in `Config.Key` that decodes to 16, 24, or 32 bytes for the `encryptcookie` middleware. Do not generate keys randomly on every startup, as this will invalidate existing user sessions.

```go
app.Use(encryptcookie.New(encryptcookie.Config{
    Key: os.Getenv("COOKIE_ENCRYPTION_KEY"),
}))
```


### Secure sensitive credentials and cookies during extraction and redirection

**Use when**

Extracting API keys, tokens, or handling authentication input and cookies in Fiber applications.

**Secure rules**

**Rule 1: Avoid extracting sensitive credentials from URL query parameters**

Do not extract API keys or session tokens from query parameters because they can be leaked in logs and browser history. Instead, use headers or cookies via extractors like `extractors.FromHeader` or `extractors.FromCookie`.

```go
app.Use(keyauth.New(keyauth.Config{
    Extractor: extractors.FromHeader("X-API-Key"),
}))
```

**Rule 2: Do not flash sensitive form inputs via redirect cookies**

Avoid calling `c.Redirect().WithInput()` on HTTP routes that process sensitive information like passwords, credentials, or session tokens, as this serializes raw input directly into client-side browser cookies.

```go
app.Post("/login", func(c fiber.Ctx) error {
    return c.Redirect().With("error", "Invalid login credentials").To("/login")
})
```


## Category: security control integrity

### Register Security Controls and Middleware Globally and in Correct Order

**Use when**

When initializing application middleware and setting up global security controls in Fiber to ensure protections remain enabled, correctly ordered, and consistently applied across all execution paths including error responses.

**Secure rules**

**Rule 1: Register security middleware globally before handling requests to ensure security response headers and protection controls are consistently preserved.**

Always attach core security middleware such as `cors.New()` and `helmet.New()` on the Fiber application instance globally before defining routes and processing requests. This ensures that response headers and defenses remain applied even when requests trigger errors or exceed limits.

```go
app := fiber.New(fiber.Config{
    BodyLimit: 4 * 1024 * 1024,
})

// Apply security middleware globally
app.Use(cors.New(cors.Config{
    AllowOrigins: []string{"https://example.com"},
    AllowCredentials: true,
}))
app.Use(helmet.New())

app.Post("/upload", func(c fiber.Ctx) error {
    return c.SendStatus(fiber.StatusOK)
})
```

**Rule 2: Register encryptcookie middleware prior to any dependent cookie middleware that inspects or modifies cookies.**

Ensure `encryptcookie` is registered before downstream cookie-reading middleware like `csrf` runs, so that the downstream middleware receives decrypted plaintext rather than raw ciphertext.

```go
app.Use(encryptcookie.New(encryptcookie.Config{
    Key: os.Getenv("COOKIE_ENCRYPTION_KEY"),
    Except: []string{csrf.ConfigDefault.CookieName},
}))
app.Use(csrf.New(csrf.Config{
    Extractor: csrf.FromHeader(csrf.HeaderName),
}))
```


## Category: session management

### Manage Session Timeouts and Prevent Manual Pool Release

**Use when**

Use when managing session lifecycles, setting expiration limits, and interacting with request context sessions.

**Secure rules**

**Rule 1: Configure an absolute session timeout alongside idle timeouts.**

Define both `IdleTimeout` and `AbsoluteTimeout` in `session.Config`, ensuring `AbsoluteTimeout` is greater than or equal to `IdleTimeout` to cap total session longevity.

```go
sessConfig := session.Config{
    IdleTimeout:     15 * time.Minute,
    AbsoluteTimeout: 12 * time.Hour,
}
```

**Rule 2: Avoid releasing session middleware instances manually within request handlers.**

Do not invoke `sess.Release()` on sessions accessed through request middleware because the framework automatically manages cleanup and returning instances to the shared pool.

```go
app.Get("/profile", func(c fiber.Ctx) error {
    sess, err := store.Get(c)
    if err != nil {
        return err
    }
    // Do not call defer sess.Release() when using session middleware
    userID := sess.Get("user_id")
    return c.SendString(fmt.Sprintf("User: %v", userID))
})
```


### Prevent MIME Sniffing with X-Content-Type-Options

**Use when**

Developing Fiber endpoints that handle sensitive sessions, CSRF tokens, JSONP responses, or dynamic content negotiation.

**Secure rules**

**Rule 1: Add the `X-Content-Type-Options: nosniff` response header**

Set `X-Content-Type-Options` to `nosniff` before returning the response. Fiber v3.4.0 provides `c.Set()` for setting response headers.

```go
app.Get("/api/data", func(c fiber.Ctx) error {
	c.Set("X-Content-Type-Options", "nosniff")

	return c.JSON(fiber.Map{
		"user": c.Query("name"),
	})
})
```


### Regenerate Session Identifiers and Secure Cookie Configuration

**Use when**

Use when configuring session middleware and handling authentication state changes to prevent session fixation and cookie theft.

**Secure rules**

**Rule 1: Regenerate the session identifier immediately upon successful user authentication.**

When a user logs in or escalates privileges, call `sess.Regenerate()` or `sess.RegenerateWithContext(ctx)` on the session object to replace the pre-authentication session identifier with a new one while preserving existing session data.

```go
app.Post("/login", func(c fiber.Ctx) error {
    sess := session.FromContext(c)
    if !isValidUser(c.FormValue("email"), c.FormValue("password")) {
        return c.Status(401).SendString("Invalid credentials")
    }
    if err := sess.Regenerate(); err != nil {
        return c.Status(500).SendString("Session error")
    }
    sess.Set("user_id", 123)
    sess.Set("authenticated", true)
    return c.Redirect("/dashboard")
})
```

**Rule 2: Explicitly enable secure cookie flags for session storage.**

Set `CookieSecure: true` and `CookieHTTPOnly: true` in your session configuration to prevent session cookies from being accessed via client-side scripts or transmitted over unencrypted HTTP connections.

```go
sessConfig := session.Config{
    CookieSecure:   true,
    CookieHTTPOnly: true,
    CookieSameSite: "Lax",
}
```
