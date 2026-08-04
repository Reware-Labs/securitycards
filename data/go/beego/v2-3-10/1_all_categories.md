# Security cards

Repository: `https://github.com/beego/beego#v2.3.10`

## Category: access control

### Configure Explicit CORS Origins and Avoid Global Wildcards with Credentials

**Use when**

Configuring Cross-Origin Resource Sharing (`CORS`) filters for web applications or API routes using `beego`.

**Secure rules**

**Rule 1: Specify explicit origin domains in `AllowOrigins` instead of enabling wildcard origins when handling sensitive resources or credentials.**

When setting up `cors.Options` via `beego.InsertFilter`, avoid using `AllowAllOrigins` or wildcard configurations alongside `AllowCredentials: true`. Explicitly list trusted domains in `AllowOrigins` to prevent unauthorized cross-origin entities from making authenticated requests and reading protected response data.

```go
beego.InsertFilter("/api/*", beego.BeforeRouter, cors.Allow(&cors.Options{
    AllowOrigins:     []string{"https://app.example.com"},
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
    AllowCredentials: true,
}))
```


### Enforce Casbin Authorization Filters and Policy Middleware Before Route Handlers

**Use when**

Enforcing access control, user roles, and permissions across backend endpoints prior to controller execution.

**Secure rules**

**Rule 1: Register the Casbin authorizer filter at the web.BeforeRouter stage to evaluate access policies before controller handlers run.**

When integrating Casbin authorization into Beego applications using `authz.NewAuthorizer`, register the filter at the `web.BeforeRouter` stage. This ensures authorization rules based on user roles, HTTP methods, and requested paths are evaluated and enforced before request handlers run, returning HTTP `403 Forbidden` for unauthorized requests.

```go
e := casbin.NewEnforcer("authz_model.conf", "authz_policy.csv")
handler := web.NewControllerRegister()
handler.InsertFilter("*", web.BeforeRouter, authz.NewAuthorizer(e))
```

**Rule 2: Always write an error response when access control checks fail inside policy functions to terminate unauthorized requests.**

Beego policy middleware functions (`PolicyFunc`) enforce access control before controller execution. Always write an HTTP response status or body within `PolicyFunc` handlers whenever access control checks fail to ensure `cont.ResponseWriter.Started` is set to true and request handling is halted.

```go
web.Policy("/api/admin/*", "*", func(ctx *context.Context) {
    if !userIsAdmin(ctx) {
        ctx.Output.SetStatus(403)
        _ = ctx.Output.Body([]byte("Forbidden"))
        return
    }
})
```


## Category: api contract misuse

### Avoid deprecated QueryTableWithCtx and QueryM2MWithCtx context methods

**Use when**

When building database queries and propagating request contexts in Beego ORM.

**Secure rules**

**Rule 1: Call context-aware execution methods directly on the resulting QuerySeter or QueryM2Mer instead of using deprecated context table constructors.**

Do not rely on `QueryTableWithCtx` or `QueryM2MWithCtx` for request context cancellation or timeout propagation because passed context parameters are ignored. Instead, call context-aware execution methods directly on the resulting `QuerySeter` or `QueryM2Mer` such as `AllWithCtx`, `OneWithCtx`, `InsertWithCtx`, or `UpdateWithCtx`.

```go
var users []*User
num, err := ormer.QueryTable("user").AllWithCtx(ctx, &users)
```


## Category: authentication

### Verify API Request Signatures and Client Timestamps Using Shared Secrets

**Use when**

When validating incoming API requests using shared secrets and timestamps to verify client identity and prevent unauthorized requests.

**Secure rules**

**Rule 1: Verify API request signatures using complete request components and ensure client timestamps are strictly checked against a replay window.**

When protecting endpoints with `apiauth.APISecretAuth` or verifying request signatures manually, ensure all core request context components such as the shared secret, HTTP method, URL parameters, and request URL are explicitly supplied. Configure an appropriate timeout threshold to prevent replay attacks.

```go
beego.InsertFilter("/api/*", beego.BeforeRouter, apiauth.APISecretAuth(getAppSecret, 60))
```


## Category: configuration source integrity

### Restrict Configuration Sources to Trusted Local Files and Controlled Deployment Artifacts

**Use when**

Loading YAML or JSON configuration files into Beego applications where environment variable interpolation is evaluated.

**Secure rules**

**Rule 1: Ensure configuration files originate exclusively from verified local filesystem locations or trusted deployment artifacts.**

Prevent untrusted user-supplied buffers or streams from being parsed by Beego configuration loaders, as automatic environment variable expansion can expose system environment variables. Load configuration files strictly from trusted paths using `config.NewConfig`.

```go
cnf, err := config.NewConfig("yaml", "/etc/myapp/config.yaml")
if err != nil {
    log.Fatalf("failed to load config: %v", err)
}

dbHost := cnf.DefaultString("database.host", "127.0.0.1")
```


## Category: cryptography

### Use secure random generation and cryptographic key lengths for encrypted session cookies

**Use when**

Configuring or encoding session cookies and implementing cryptographic key management within Beego applications.

**Secure rules**

**Rule 1: Provide cryptographic keys matching exact AES block requirements for session cookie encryption.**

Supply cryptographically generated random keys matching standard AES key sizes like 16, 24, or 32 bytes for AES-128, AES-192, or AES-256 when encoding or decoding session cookies using AES block ciphers.

```go
blockKey := session.GenerateRandomKey(32) // 256-bit AES key
block, err := aes.NewCipher(blockKey)
if err != nil {
	log.Fatalf("failed to initialize cipher: %v", err)
}

encoded, err := encodeCookie(block, hashKey, securityName, val)
```


## Category: csrf

### Implement Synchronizer Token Validation for State-Changing Requests

**Use when**

When developing state-changing web endpoints using Beego controllers and handlers that require Cross-Site Request Forgery protection.

**Secure rules**

**Rule 1: Enable XSRF protection globally or on controllers and validate incoming request tokens against the context token.**

Configure `EnableXSRF` on `WebConfig` or ensure `EnableXSRF` remains enabled on custom controllers handling state-changing methods. Call `XSRFToken` beforehand to generate and load the token into context, and invoke `CheckXSRFCookie()` during request processing to validate incoming tokens.

```go
web.BConfig.WebConfig.EnableXSRF = true
web.BConfig.WebConfig.XSRFKey = "_xsrf_token"
web.BConfig.WebConfig.XSRFExpire = 3600
```


## Category: deserialization

### Register Custom Types Before Gob Deserialization

**Use when**

When storing and retrieving custom struct types in Beego session providers that utilize `gob` encoding and decoding.

**Secure rules**

**Rule 1: Explicitly register custom Go types using gob.Register during application initialization before session reading or writing occurs.**

Because session providers in Beego serialize and deserialize values using `gob` encoding, any custom struct types saved into the session must be registered with `gob.Register` during application initialization to prevent decoding errors and ensure correct session restoration.

```go
import (
	"encoding/gob"
	"github.com/beego/beego/v2/server/web"
)

type UserSession struct {
	UserID int
	Role   string
}

func init() {
	gob.Register(UserSession{})
}
```


## Category: file handling

### Validate and Sanitize File Paths to Prevent Path Traversal

**Use when**

When handling user input or uploaded filenames in controller operations, file downloads, or file attachments.

**Secure rules**

**Rule 1: Sanitize user-uploaded filenames using `filepath.Base` and construct explicit target paths before saving files.**

Never use untrusted `multipart.FileHeader.Filename` values directly to build disk paths when processing uploads via `Controller.GetFile`, `Controller.GetFiles`, or `Controller.SaveToFile`. Developers must sanitize the filename using `filepath.Base` or generate isolated, random filenames before calling `SaveToFile` to prevent arbitrary file overwrite or execution outside designated upload directories.

```go
func (c *UploadController) Post() {
	_, header, err := c.GetFile("upload")
	if err != nil {
		c.CustomAbort(400, "Invalid file")
		return
	}
	safeFilename := filepath.Base(header.Filename)
	targetPath := filepath.Join("/var/app/storage/uploads", safeFilename)
	err = c.SaveToFile("upload", targetPath)
	if err != nil {
		c.CustomAbort(500, "Failed to save file")
	}
}
```

**Rule 2: Verify resolved file paths remain strictly within intended storage boundaries before serving downloads.**

Ensure user-supplied filenames passed to `BeegoOutput.Download` are sanitized with `filepath.Clean` and verified to remain strictly within the intended storage directory to prevent arbitrary file read vulnerabilities.

```go
baseDir := "/var/app/uploads"
targetPath := filepath.Clean(filepath.Join(baseDir, userInputFilename))
if !strings.HasPrefix(targetPath, filepath.Clean(baseDir)+string(filepath.Separator)) {
    ctx.Output.SetStatus(403)
    return
}
ctx.Output.Download(targetPath)
```


## Category: injection

### Use Parameterized Queries in Beego ORM and QueryBuilders

**Use when**

Building database queries, raw SQL statements, or query builder expressions using Beego ORM.

**Secure rules**

**Rule 1: Use parameter placeholders and separate argument binding instead of string concatenation in raw queries and query builders.**

When executing raw database queries or constructing queries with query builders, supply variable inputs using parameter placeholders such as `?` rather than formatting or concatenating untrusted input strings directly into the SQL query.

```go
var list []*DataNull
num, err := dORM.Raw("SELECT * FROM data_null WHERE id = ?", userID).QueryRows(&list)
```


## Category: input contract definition

### Validate Untrusted Struct Inputs Using Beego Validation Rules

**Use when**

When validating untrusted incoming request data and struct objects against strict type, range, and format rules before processing them in application logic.

**Secure rules**

**Rule 1: Enforce strict validation rules on struct fields using validation tags and inspect return error values before processing input data.**

Use Beego's validation package to apply validation struct tags such as `Required`, `Range`, `MaxSize`, `Match`, `Email`, and `IP` on struct fields or direct variables. Always check return values from `valid.Valid(struct)` or `valid.HasErrors()` and halt execution if validation fails.

```go
type User struct {
	Name string `valid:"Required;MaxSize(15)"`
	Age  int    `valid:"Required;Range(1, 140)"`
}

func processUser(u User) {
	valid := validation.Validation{}
	b, err := valid.Valid(&u)
	if err != nil {
		return
	}
	if !b {
		for _, err := range valid.Errors {
			log.Println(err.Key, err.Message)
		}
		return
	}
}
```

**Rule 2: Inspect boolean return values and error states when evaluating nested struct fields with recursive validation.**

Always inspect the boolean return value and `v.HasErrors()` after calling `v.Valid()` or `v.RecursiveValid()`. Use `v.RecursiveValid()` when handling untrusted incoming structs that contain nested struct fields, as standard `v.Valid()` only evaluates top-level struct fields.

```go
type Profile struct {
    Email string `valid:"Required;Email"`
}

type UserInput struct {
    Name    string  `valid:"Required;MaxSize(50)"`
    Profile Profile
}

func HandleInput(input UserInput) {
    valid := validation.Validation{}
    pass, err := valid.RecursiveValid(&input)
    if err != nil || !pass {
        for _, err := range valid.Errors {
            log.Printf("Validation error on field %s: %s", err.Field, err.Message)
        }
        return
    }
}
```

**Rule 3: Configure required-first validation for optional struct fields to prevent unexpected validation rejections.**

When using Beego's struct tag validation with `validation.Validation`, optional empty fields will fail format rules unless `RequiredFirst: true` is configured on the `Validation` instance. Developers must explicitly set `Validation{RequiredFirst: true}` to ensure optional fields do not fail validation when omitted.

```go
type User struct {
	ReqEmail string `valid:"Required;Email"`
	Email    string `valid:"Email"`
}

valid := validation.Validation{RequiredFirst: true}
ok, err := valid.Valid(u)
if err != nil || !ok {
	return
}
```

**Rule 4: Target cross-platform integer types for numerical range validations.**

When configuring struct tag parameters for validators on 32-bit architectures, ensure numerical bounds do not rely on int64 values. The parseParam helper returns an error on 32-bit platforms when encountering int64 parameter types, so target standard int or int32 for range validations.

```go
type UserInput struct {
    Quantity int `valid:"Min(1); Max(1000)"`
}
```

**Rule 5: Apply custom pattern matching for global or international input formats instead of region-specific built-in validators.**

Beego validators like Mobile, Tel, Phone, and ZipCode hardcode regular expressions designed exclusively for Chinese phone numbers and postal codes. Use custom pattern matching or dedicated validation packages when validating international input to prevent legitimate values from being rejected.

```go
var intlPhoneRegex = regexp.MustCompile(`^\+?[1-9]\d{1,14}$`)

valid.Match(userPhone, intlPhoneRegex, "Phone").Message("Invalid international phone number")
```


## Category: input interpretation safety

### Sanitize and Validate Automatically Decoded Route Parameters and Request Inputs

**Use when**

Extracting and utilizing route parameters, query strings, or request payloads in Beego applications where automated decoding or interpretation boundaries apply.

**Secure rules**

**Rule 1: Constrain route parameters with Beego route expressions when their format is known**

Define the accepted format in the route using `:param(reg)` or a built-in constraint such as `:id:int`. Beego only invokes the handler when the path value matches the route expression, and the matched value remains available through `ctx.Input.Param()`.

```go
package main

import (
	"github.com/beego/beego/v2/server/web"
	"github.com/beego/beego/v2/server/web/context"
)

func main() {
	web.Get("/search/:keyword([A-Za-z0-9_]+)", func(ctx *context.Context) {
		keyword := ctx.Input.Param(":keyword")
		ctx.WriteString(keyword)
	})

	web.Run()
}
```


## Category: output encoding

### Maintain HTML Escaping in HTTP Settings and JSON Serialization

**Use when**

When configuring HTTP settings or serializing JSON payloads via `httplib` that may be rendered in web interfaces or HTML templates.

**Secure rules**

**Rule 1: Escape values that require HTML encoding with `htmlquote`**

Use Beego’s built-in `htmlquote` template function when a value requires HTML escaping. Do not use `str2html` for such values because it converts a string to HTML without escaping it.

```gotemplate
{{htmlquote .Content}}
```


## Category: resource exhaustion

### Configure Explicit Request Body Size Limits

**Use when**

Configuring web application server parameters or handling incoming request payloads in Beego to protect against memory exhaustion and denial-of-service vulnerabilities.

**Secure rules**

**Rule 1: Enforce strict size limits on incoming request payloads and server request bodies.**

Set strict size bounds using `MaxMemory` and `MaxUploadSize` configurations to prevent excessive heap allocation or disk utilization caused by unbounded request bodies.

```go
web.BConfig.MaxMemory = 10 << 20
web.BConfig.MaxUploadSize = 20 << 20
```


## Category: runtime environment hardening

### Configure Production RunMode and Disable Debug Settings

**Use when**

Deploying the Beego application to production environments where sensitive internals, error traces, and SQL debugging output must be hidden from end-users.

**Secure rules**

**Rule 1: Set the Beego RunMode to production and disable error rendering and ORM debugging.**

Configure `web.BConfig.RunMode` to `prod` and explicitly set `web.BConfig.EnableErrorsShow` and `web.BConfig.EnableErrorsRender` to `false` to prevent leaking internal stack traces and error messages during panics. Additionally, ensure `orm.Debug` is set to `false` in production to avoid exposing full SQL statements, parameters, and query execution times in log files.

```go
web.BConfig.RunMode = "prod"
web.BConfig.EnableErrorsShow = false
web.BConfig.EnableErrorsRender = false
orm.Debug = false
```


## Category: secret handling

### Load Credentials and Secrets Securely from Environment Variables or External Providers

**Use when**

Configuring database connection strings, session providers, cache stores, logging targets, or configuration files that require sensitive credentials and authentication secrets.

**Secure rules**

**Rule 1: Load sensitive credentials and keys from environment variables instead of hardcoding them in source or configuration files.**

Always retrieve credentials such as database DSNs, API keys, passwords, and signing keys via environment variables or secret management services when initializing providers like `session.NewManager`, `orm.RegisterDataBase`, or logging targets. Avoid hardcoding plaintext secrets in static configuration or source files.

```go
dbDSN := os.Getenv("DATABASE_DSN")
orm.RegisterDataBase("default", "mysql", dbDSN, 30)
```


## Category: security control integrity

### Halt Request Processing in Security Filters Using ReturnOnOutput

**Use when**

Registering access control, authentication, or input validation filters via `InsertFilter` where writing an error status code or response body must immediately halt downstream request processing.

**Secure rules**

**Rule 1: Pass WithReturnOnOutput(true) when registering security filters to ensure request processing halts immediately upon writing a response.**

When registering access control, authentication, or input validation filters via `InsertFilter` (such as at `BeforeRouter` or `BeforeExec`), pass `WithReturnOnOutput(true)` to ensure request processing halts immediately when the filter writes a response body or error status code. Failing to enable this option can cause execution to continue to subsequent filters or controller handlers even after an error response is written, leading to authorization bypasses.

```go
mux := web.NewControllerRegister()
mux.InsertFilter("/admin/*", web.BeforeRouter, func(ctx *context.Context) {
    if !isAuthorized(ctx) {
        ctx.Output.SetStatus(http.StatusForbidden)
        ctx.Output.Body([]byte("Access Denied"))
    }
}, web.WithReturnOnOutput(true))
```


## Category: session management

### Configure Secure Cookie Attributes and Explicit Cryptographic Keys

**Use when**

Configuring session providers and cookie security attributes for web applications and API endpoints.

**Secure rules**

**Rule 1: Configure explicit static secret keys and enable secure cookie attributes.**

When initializing session providers, explicitly set static secret keys such as `securityKey` and `blockKey` to prevent Beego from generating transient random keys on startup, which invalidates active sessions across restarts. In addition, ensure `secure` or `CfgSecure` is enabled in production environments to restrict cookies to HTTPS channels.

```go
sessionConfig := session.NewManagerConfig(
    session.CfgCookieName("gosessionid"),
    session.CfgSetCookie(true),
    session.CfgSecure(true),
    session.CfgGcLifeTime(3600),
    session.CfgMaxLifeTime(3600),
    session.CfgProviderConfig("127.0.0.1:6379,100,,0,30"),
)
globalSessions, err := session.NewManager("redis", sessionConfig)
```

**Rule 2: Disable URL-based session tracking and restrict HTTPOnly usage.**

Keep `SessionDisableHTTPOnly` set to false and `SessionEnableSidInURLQuery` set to false to prevent token leakage via server logs, browser history, and Referer headers.

```go
web.BConfig.WebConfig.Session.SessionOn = true
web.BConfig.WebConfig.Session.SessionDisableHTTPOnly = false
web.BConfig.WebConfig.Session.SessionEnableSidInURLQuery = false
web.BConfig.WebConfig.Session.SessionCookieSameSite = http.SameSiteLaxMode
```


### Propagate Request Context and Promptly Release Session Resources

**Use when**

Managing session lifecycle scopes and cleaning up session resources in request handler routines.

**Secure rules**

**Rule 1: Pass active request context and release session resources upon request completion.**

Always invoke `SessionRelease` with the active HTTP request context (`r.Context()`) immediately after acquiring a session via `SessionStart` to ensure session persistence and network operations respect request cancellation and lifecycle scopes.

```go
func handleRequest(w http.ResponseWriter, r *http.Request) {
    sess := globalSessions.SessionStart(w, r)
    defer sess.SessionRelease(r.Context(), w)
    // Perform session operations safely
}
```


### Regenerate Session Identifiers Upon Authentication and Invalidate Tokens on Logout

**Use when**

Handling user authentication state changes, privilege elevation, and user logout workflows.

**Secure rules**

**Rule 1: Regenerate session identifiers immediately upon authentication or privilege elevation.**

Invoke session regeneration functions such as `SessionRegenerateID` or `SessionRegenerate` immediately after authenticating a user or changing privilege levels to assign a newly generated session ID and prevent session fixation attacks.

```go
func loginHandler(w http.ResponseWriter, r *http.Request) {
    sess, err := globalSessions.SessionRegenerateID(w, r)
    if err != nil {
        http.Error(w, "Session regeneration failed", http.StatusInternalServerError)
        return
    }
    sess.Set(r.Context(), "user_id", authenticatedUser.ID)
}
```

**Rule 2: Destroy session records when terminating a user session.**

Always invoke `SessionDestroy` when handling user logouts or terminating session states to ensure active session identifiers are invalidated and cannot be reused.

```go
func LogoutHandler(w http.ResponseWriter, r *http.Request) {
    globalSessions.SessionDestroy(w, r)
    http.Redirect(w, r, "/login", http.StatusFound)
}
```
