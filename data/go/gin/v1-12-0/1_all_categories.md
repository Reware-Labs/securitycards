# Security cards

Repository: `https://github.com/gin-gonic/gin#v1.12.0`

## Category: access control

### Return Immediately After Aborting Request in Auth Middleware

**Use when**

When implementing authentication or authorization middleware in Gin to prevent unauthorized actions and enforce access control.

**Secure rules**

**Rule 1: Explicitly return after invoking abort methods in authorization middleware.**

Calling `c.Abort()`, `c.AbortWithStatus()`, or `c.AbortWithError()` prevents downstream handlers from executing, but it does not terminate the current handler function immediately. You must explicitly invoke `return` after calling abort methods to ensure that subsequent security checks or sensitive code inside that same middleware function do not continue to execute.

```go
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        if !isAuthorized(c.Request) {
            c.AbortWithStatus(http.StatusUnauthorized)
            return // Stop execution of the current handler immediately
        }
        c.Next()
    }
}
```


## Category: api contract misuse

### Validate HTTP status codes before invoking redirect renderers

**Use when**

When rendering redirects using `render.Redirect` within a Gin application.

**Secure rules**

**Rule 1: Ensure HTTP status codes passed to `render.Redirect` are strictly valid redirect status codes.**

Always pass standard HTTP status constants from `net/http` such as `http.StatusFound`, `http.StatusMovedPermanently`, or `http.StatusTemporaryRedirect` when constructing `render.Redirect` to avoid runtime panics caused by unpermitted status codes.

```go
func handleRedirect(c *gin.Context) {
    code := http.StatusFound
    redirect := render.Redirect{
        Code:     code,
        Request:  c.Request,
        Location: "/dashboard",
    }
    c.Render(code, redirect)
}
```


## Category: authentication

### Authenticate incoming requests using Gin basic authentication middleware

**Use when**

Implementing credential verification and establishing user identity for protected HTTP routes using built-in authentication middleware.

**Secure rules**

**Rule 1: Validate credentials using BasicAuth and retrieve authenticated identities exclusively via the context key.**

Use `gin.BasicAuth` with a populated accounts map to validate incoming credentials securely using constant-time comparisons. Downstream handlers must retrieve the verified identity exclusively from `c.MustGet(gin.AuthUserKey)` or `c.Get(gin.AuthUserKey)` to ensure the request has successfully passed authentication.

```go
router := gin.Default()

authorized := router.Group("/admin", gin.BasicAuth(gin.Accounts{
    "admin": "SecretPassword123!",
}))

authorized.GET("/dashboard", func(c *gin.Context) {
    user := c.MustGet(gin.AuthUserKey).(string)
    c.String(http.StatusOK, "Hello %s", user)
})
```


## Category: csrf

### Configure SameSite Cookie Attributes to Prevent Cross-Site Request Forgery

**Use when**

Setting session or authentication cookies using `gin.Context` for stateful web applications.

**Secure rules**

**Rule 1: Explicitly set the SameSite attribute on cookies using `c.SetSameSite` before invoking `c.SetCookie`.**

To mitigate cross-site request forgery attacks, ensure session and authentication cookies are not left with unconfigured SameSite behavior. Invoke `c.SetSameSite` with `http.SameSiteLaxMode` or `http.SameSiteStrictMode` prior to calling `c.SetCookie` to prevent browsers from attaching sensitive cookies to cross-site requests.

```go
c.SetSameSite(http.SameSiteLaxMode)
c.SetCookie("session_id", token, 3600, "/", "", true, true)
```


## Category: file handling

### Sanitize and Validate Uploaded Filenames and Paths in Gin

**Use when**

Handling file uploads from multipart forms in Gin handlers and saving them to the local filesystem.

**Secure rules**

**Rule 1: Strip untrusted path information from uploaded filenames before saving files**

When accepting file uploads via `c.FormFile`, never trust the client-supplied `file.Filename` directly because it may contain directory traversal sequences like `../../`. Use filepath.Base, reject . and non-local results, then join the filename with a safe destination directory.

```go
file, err := c.FormFile("file")
if err != nil {
    c.String(http.StatusBadRequest, "Bad request")
    return
}
filename := filepath.Base(file.Filename)
if filename == "." || !filepath.IsLocal(filename) {
c.String(http.StatusBadRequest, "Invalid filename")
return
}
dst := filepath.Join("/safe/upload/dir", filename)
c.SaveUploadedFile(file, dst)
```


### Secure Static File Serving and Path Containment in Gin

**Use when**

Serving static files, asset folders, or handling custom file path parameters in Gin applications.

**Secure rules**

**Rule 1: Sanitize and confine custom file paths within designated storage roots when using `c.File()`**

Never pass raw user inputs or unvalidated path parameters directly to `c.File()`. Clean requested paths, verify they remain within the safe base directory, and ensure the target is a regular file before serving.

```go
r.GET("/assets/*filepath", func(c *gin.Context) {
	name := strings.TrimPrefix(c.Param("filepath"), "/")

	file, err := os.OpenInRoot("/var/www/static", name)
	if err != nil {
		c.String(http.StatusNotFound, "File not found")
		return
	}
	defer file.Close()

	info, err := file.Stat()
	if err != nil || !info.Mode().IsRegular() {
		c.String(http.StatusNotFound, "File not found")
		return
	}

	http.ServeContent(c.Writer, c.Request, info.Name(), info.ModTime(), file)
})
```

**Rule 2: Restrict root directory paths when exposing static content via static routing functions.**

Ensure that root paths or file system instances passed to `Static`, `StaticFile`, or `StaticFS` target only explicitly intended public directories and avoid broad system paths or untrusted input.

```go
ginS.Static("/assets", "./public/assets")
ginS.StaticFile("/favicon.ico", "./public/favicon.ico")
```

**Rule 3: Disable directory browsing when serving static files.**

Ensure directory listing is explicitly disabled to prevent exposing directory indexes when configuring custom file systems with `StaticFS` or `StaticFileFS`.

```go
router := gin.Default()
router.Static("/public", "./public")
router.StaticFS("/assets", gin.Dir("./assets", false))
```


## Category: input contract definition

### Enforce strict input contracts with struct validation tags and binders

**Use when**

Handling incoming HTTP request payloads or path parameters and enforcing required fields, types, and input constraints.

**Secure rules**

**Rule 1: Use struct tags with `ShouldBind` or `ShouldBindJSON` to enforce strict input validation and handle parsing errors explicitly.**

Define explicit struct tags such as `binding:"required"` and use `ShouldBind` or `ShouldBindJSON` to ensure unvalidated request payloads are rejected before entering core application logic.

```go
type LoginRequest struct {
    User     string `json:"user" binding:"required"`
    Password string `json:"password" binding:"required"`
}

router.POST("/login", func(c *gin.Context) {
    var req LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    // Process validated request
})
```

**Rule 2: Register custom field validation rules using `RegisterValidation` to enforce domain-specific input contracts.**

Type-assert the underlying `go-playground/validator` engine exposed by `binding.Validator.Engine()` to `*validator.Validate` and register custom validation rules to enforce specialized input constraints across bound request models.

```go
if engine, ok := binding.Validator.Engine().(*validator.Validate); ok {
    _ = engine.RegisterValidation("notone", func(fl validator.FieldLevel) bool {
        if val, ok := fl.Field().Interface().(int); ok {
            return val != 1
        }
        return false
    })
}

type UserRequest struct {
    Code int `json:"code" binding:"required,notone"`
}
```

**Rule 3: Validate URI path parameters with `BindUri` and struct validation tags.**

Use `c.BindUri()` or `c.ShouldBindUri()` along with struct validation tags to enforce strict input validation contracts on URL path parameters and automatically return HTTP 400 Bad Request when validation fails.

```go
type Member struct {
	Number string `uri:"num" binding:"required,uuid"`
}

router.GET("/members/:num", func(c *gin.Context) {
	var m Member
	if err := c.BindUri(&m); err != nil {
		// c.BindUri automatically writes HTTP 400 response on failure
		return
	}
	c.JSON(http.StatusOK, gin.H{"member": m.Number})
})
```


## Category: input interpretation safety

### Configure UseEscapedPath to prevent route parameter decoding ambiguity

**Use when**

When routing needs to evaluate raw percent-encoded request paths rather than unescaped paths to prevent validation and policy bypass.

**Secure rules**

**Rule 1: Configure router.UseEscapedPath = true when routing needs to evaluate raw percent-encoded request paths.**

Set `router.UseEscapedPath = true` and `UnescapePathValues = false` during router setup to ensure percent-encoded characters like `%25` or `%2F` are preserved during route matching and parameter extraction, preventing path bypasses.

```go
router := gin.New()
router.UseEscapedPath = true
router.UnescapePathValues = false

router.GET("/v1/:path", func(c *gin.Context) {
    pathParam := c.Param("path")
    c.String(200, pathParam)
})
```


## Category: interface protocol hardening

### Sanitize Forwarded Prefix Headers at Reverse Proxy Boundaries

**Use when**

Configuring reverse proxy boundaries and managing incoming request forwarding headers in Gin applications.

**Secure rules**

**Rule 1: Ensure reverse proxies explicitly set or strip untrusted `X-Forwarded-Prefix` headers to prevent HTTP redirect manipulation.**

When `RedirectTrailingSlash` is enabled, Gin inspects incoming `X-Forwarded-Prefix` HTTP headers to construct location headers for redirects. Configure your reverse proxy to override or strip untrusted client headers to prevent malicious injection.

```go
router := gin.New()
router.RedirectTrailingSlash = true
```


## Category: network boundary

### Configure Explicit Trusted Proxies and Handle Errors

**Use when**

Configuring trusted upstream proxies or load balancers for Gin routers to accurately parse client IP headers.

**Secure rules**

**Rule 1: Configure explicit trusted proxy IP ranges and handle errors using SetTrustedProxies.**

Trusting arbitrary proxy headers permits attackers to fake their client IP address, undermining access controls and rate limiting. Applications must explicitly configure trusted proxy IP ranges using `SetTrustedProxies` or pass `nil` to disable proxy header parsing when direct client connections are expected. Always handle error returns when calling `SetTrustedProxies` with IP address or CIDR range strings, because invalid IP addresses or out-of-range CIDR notations fail parsing and return an error.

```go
router := gin.New()
err := router.SetTrustedProxies([]string{"192.168.1.0/24", "10.0.0.1"})
if err != nil {
    log.Fatalf("Failed to configure trusted proxies: %v", err)
}
```


## Category: output encoding

### Escape JSON Responses for HTML Contexts

**Use when**

When serving JSON payloads that may be embedded directly inside HTML templates or web view contexts.

**Secure rules**

**Rule 1: Use standard JSON rendering to automatically escape HTML elements and prevent injection.**

Use Gin's standard JSON rendering via `c.JSON` or `render.JSON` to ensure that characters like `<`, `>`, and `&` are automatically converted into safe Unicode escape sequences. Avoid disabling HTML escaping or using raw encoders in web contexts where output might be evaluated as script or HTML markup.

```go
c.JSON(http.StatusOK, gin.H{
    "message": "<b>Welcome</b>",
})
```


## Category: resource exhaustion

### Limit Multipart Upload Memory Allocation

**Use when**

Processing multipart form uploads in Gin applications to prevent memory exhaustion and Denial of Service.

**Secure rules**

**Rule 1: Configure MaxMultipartMemory to limit the memory allocated during multipart form processing.**

Explicitly set `router.MaxMultipartMemory` to an appropriate size limit to prevent concurrent large uploads from exhausting server RAM and causing a Denial of Service. Values can be assigned in bytes, such as using byte shift operations for readability.

```go
router := gin.Default()
router.MaxMultipartMemory = 8 << 20 // Limit memory buffer to 8 MiB
```


## Category: runtime environment hardening

### Configure Gin to Release Mode in Production

**Use when**

initializing the Gin application engine for a production environment to disable internal debugging outputs.

**Secure rules**

**Rule 1: Set Gin execution mode to release mode before instantiating the router engine.**

Explicitly configure Gin's execution mode to `gin.ReleaseMode` by invoking `gin.SetMode(gin.ReleaseMode)` or by setting the `GIN_MODE=release` environment variable during application startup. Avoid running production servers in `DebugMode` to prevent leaking sensitive application internal information, full route tables, file system paths, and internal error details to standard output.

```go
func main() {
    gin.SetMode(gin.ReleaseMode)
    router := gin.New()
    // ... register middleware and routes
}
```


## Category: secret handling

### Redact Query Strings and Sensitive Headers in Application Logs

**Use when**

Configuring request logging and panic recovery middleware to prevent sensitive credentials, tokens, and query parameters from appearing in log outputs.

**Secure rules**

**Rule 1: Configure the Gin request logger to skip query string output and prevent sensitive parameters from exposure.**

Set `SkipQueryString: true` within `gin.LoggerConfig` when initializing the request logger so that URL query parameters containing credentials or tokens are omitted from log files.

```go
loggerConfig := gin.LoggerConfig{
    SkipQueryString: true,
}
router.Use(gin.LoggerWithConfig(loggerConfig))
```

**Rule 2: Sanitize or omit custom credentials and non-authorization headers in custom recovery handlers.**

Implement a custom recovery handler using `gin.CustomRecovery` to log generic error details without dumping unmasked sensitive headers, cookies, or request bodies that are not automatically masked by default recovery mechanisms.

```go
router := gin.New()
router.Use(gin.CustomRecovery(func(c *gin.Context, err any) {
    log.Printf("[Recovery] Panic caught on %s %s: %v", c.Request.Method, c.Request.URL.Path, err)
    c.AbortWithStatus(http.StatusInternalServerError)
}))
```


## Category: security control integrity

### Preserve Error Status Codes with Custom Recovery Handlers

**Use when**

When configuring panic recovery middleware in Gin applications to ensure clean error handling and prevent uncontrolled status code overwrites.

**Secure rules**

**Rule 1: Use custom recovery handlers to gracefully catch panics and control error status codes.**

Implement `CustomRecovery` or `CustomRecoveryWithWriter` to define clean error handling logic when panics occur in HTTP handlers. If a handler explicitly calls `c.AbortWithStatus(...)` before a panic or within the custom recovery handler, Gin preserves the aborted HTTP status code rather than overwriting it with an uncontrolled response.

```go
router := gin.New()
handleRecovery := func(c *gin.Context, err any) {
    c.AbortWithStatus(http.StatusInternalServerError)
}
router.Use(gin.CustomRecovery(handleRecovery))
```


## Category: session management

### Configure Secure HttpOnly and SameSite Attributes for Cookies

**Use when**

When issuing session cookies using Gin's `Context.SetCookie` and `Context.SetSameSite` methods.

**Secure rules**

**Rule 1: Enforce secure flags, HttpOnly attributes, and a SameSite policy on all cookies.**

Explicitly set `c.SetSameSite` and configure `c.SetCookie` with `secure = true` and `httpOnly = true` to protect tokens against cross-site scripting and interception.

```go
c.SetSameSite(http.SameSiteLaxMode)
c.SetCookie("session_id", token, 3600, "/", "example.com", true, true)
```


### Configure secure cookie flags and SameSite attribute for session tokens

**Use when**

Issuing session identifier cookies in handlers using gin.Context

**Secure rules**

**Rule 1: Set SameSite, HttpOnly, Secure, path, and domain attributes explicitly when issuing session cookies**

When issuing session cookies using `gin.Context`, call `c.SetSameSite` before invoking `c.SetCookie` to properly attach the `SameSite` attribute to the HTTP response header. Ensure session cookies explicitly set `httpOnly` to true to prevent JavaScript client access, `secure` to true to mandate HTTPS transport, and restrict the path and domain fields to the minimal required scope.

```go
c.SetSameSite(http.SameSiteLaxMode)
c.SetCookie("session_token", token, 3600, "/", "example.com", true, true)
```
