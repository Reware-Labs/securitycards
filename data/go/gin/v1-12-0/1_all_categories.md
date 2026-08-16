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


### Take the acting identity from the verified credential

**Use when**

A handler reads or modifies data belonging to a specific user and the request also carries a username, account id, or email.

**Secure rules**

**Rule 1: Read the subject from the context value the middleware set, not the payload.**

An identifier in the request says who the caller *claims* to be; only the verified token says who they are. Binding `owner` from the body lets any authenticated caller reach anyone else's data by editing one field. Store the verified subject with `c.Set`, read it with `c.Get`, and key every lookup on it. Where the contract carries the identifier too, compare and reject with `403`.

```go
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        username, err := verifyToken(c.GetHeader("Authorization"))
        if err != nil {
            c.AbortWithStatus(http.StatusUnauthorized)
            return
        }
        c.Set("currentUser", username) // the only trusted source of identity
        c.Next()
    }
}

func registerNotes(router *gin.Engine) {
    router.POST("/notes", func(c *gin.Context) {
        var req struct {
            Owner string `json:"owner" binding:"required"`
            Body  string `json:"body" binding:"required"`
        }
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
            return
        }
        currentUser := c.GetString("currentUser")
        if req.Owner != currentUser {
            c.AbortWithStatusJSON(http.StatusForbidden,
                gin.H{"error": "cannot act on behalf of another user"})
            return
        }
        saveNote(currentUser, req.Body) // keyed by the verified identity
        c.JSON(http.StatusOK, gin.H{"status": "created"})
    })
}
```

**Rule 2: Register the authorization middleware on a route group.**

Authorization applied handler by handler is only as complete as the last route somebody added, and a `GET` filtered by a query parameter is as exploitable as an unguarded `POST`. A `router.Group` makes every route inherit it, so protection is the default. Scope the query by the authenticated subject as well, and prefer `404` over `403` where the record's existence is sensitive.

```go
router := gin.Default()

authorized := router.Group("/", AuthMiddleware()) // applies to every route below
authorized.GET("/notes", func(c *gin.Context) {
    records, ok := loadNotes(c.GetString("currentUser")) // scoped, not filtered after
    if !ok {
        c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"notes": records})
})
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


## Category: cryptography

### Hash passwords slowly and draw tokens from a secure source

**Use when**

Registering users, verifying login credentials, or issuing session identifiers and API tokens.

**Secure rules**

**Rule 1: Store passwords as `bcrypt` or `argon2id` hashes, not plaintext or a fast digest.**

Anyone who obtains the database gets every stored value, and a bare `crypto/sha256` or `crypto/md5` digest barely helps: those are built to be fast, so commodity hardware tests billions of candidates per second. `bcrypt.GenerateFromPassword` applies a work factor and embeds a random salt, and `CompareHashAndPassword` compares in constant time. Bcrypt reads at most 72 bytes and returns `ErrPasswordTooLong` beyond that, so bound the field length; `argon2` suits longer passphrases.

```go
import "golang.org/x/crypto/bcrypt"

func storeUser(db *sql.DB, email, password string) error {
    hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    if err != nil {
        return err
    }
    _, err = db.Exec(
        "INSERT INTO users (email, password_hash) VALUES (?, ?)", email, hash,
    )
    return err
}

func checkLogin(storedHash, supplied string) bool {
    return bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(supplied)) == nil
}
```

**Rule 2: Generate session tokens and identifiers with `crypto/rand`.**

`math/rand` is deterministic: from a handful of observed outputs its state can be recovered and every later token predicted. Session identifiers, reset codes, and API keys need `crypto/rand`, which reads the operating system's entropy source. Draw at least 16 bytes — 32 for long-lived tokens — and encode the raw bytes rather than reducing them to a short alphabet.

```go
import (
    "crypto/rand"
    "encoding/base64"
)

func newSessionToken() (string, error) {
    buf := make([]byte, 32)
    if _, err := rand.Read(buf); err != nil {
        return "", err
    }
    return base64.RawURLEncoding.EncodeToString(buf), nil
}
```

**Rule 3: Compare tokens and signatures in constant time.**

`==` and `bytes.Equal` stop at the first differing byte, so the time taken reveals how much of a guess was right and a remote caller can recover a token byte by byte. Use `subtle.ConstantTimeCompare` for opaque secrets and `hmac.Equal` for message authentication codes. Hashing both sides to a fixed length first also removes the length leak a raw comparison exposes.

```go
import (
    "crypto/sha256"
    "crypto/subtle"
)

func tokensMatch(presented, expected string) bool {
    a := sha256.Sum256([]byte(presented))
    b := sha256.Sum256([]byte(expected))
    return subtle.ConstantTimeCompare(a[:], b[:]) == 1
}
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


## Category: dangerous execution

### Parse templates from your own files, never from request data

**Use when**

A handler renders a template, or accepts template text, a formula, or another expression from the caller.

**Secure rules**

**Rule 1: Parse templates from your own files and pass request data in only as data.**

`template.New("t").Parse(userInput)` compiles the caller's text into an executable template. Template actions traverse whatever you pass to `Execute` and can call exported methods on it, so a caller controlling the body reads that data. `text/template` also applies no escaping, making its output unsafe in an HTML response. Load templates once at startup with `router.LoadHTMLGlob` and let `c.HTML` supply untrusted values as the data argument, where `html/template` escapes them per context.

```go
router := gin.Default()
router.LoadHTMLGlob("templates/*.tmpl") // authored by us, parsed once at startup

router.GET("/profile/:name", func(c *gin.Context) {
    // The caller controls the value, never the template body.
    c.HTML(http.StatusOK, "profile.tmpl", gin.H{"name": c.Param("name")})
})
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

**Rule 2: Read text fields as text, not as uploaded files**

A multipart request can contain both ordinary fields and files. Use `c.PostForm` or `c.GetPostForm` for text fields and reserve `c.FormFile` for actual file parts; treating a text field as a file rejects valid requests.

```go
page, ok := c.GetPostForm("profile_page")
if !ok {
    c.String(http.StatusBadRequest, "Missing profile page")
    return
}
photo, err := c.FormFile("profile_photo")
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


### Contain archive members inside the extraction directory

**Use when**

Unpacking a zip or tar archive that arrived as an upload or from a caller-supplied location.

**Secure rules**

**Rule 1: Confirm each member's destination stays inside the extraction root.**

Archive entries carry their own path and neither `archive/zip` nor `archive/tar` sanitizes it, so a member named `../../etc/cron.d/job` writes exactly there. `filepath.IsLocal` rejects absolute paths, `..` components, and reserved Windows names in one call, and joining a local name to the root cannot leave it. Skip entries that are not regular files, so no symlink redirects later reads.

```go
func extractMember(root string, f *zip.File) error {
    if !filepath.IsLocal(f.Name) {
        return fmt.Errorf("unsafe archive entry: %s", f.Name)
    }
    if !f.FileInfo().Mode().IsRegular() {
        return nil // skip directories, symlinks, devices
    }
    dst := filepath.Join(root, f.Name)
    if err := os.MkdirAll(filepath.Dir(dst), 0o750); err != nil {
        return err
    }
    src, err := f.Open()
    if err != nil {
        return err
    }
    defer src.Close()

    out, err := os.OpenFile(dst, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o640)
    if err != nil {
        return err
    }
    defer out.Close()

    _, err = io.Copy(out, src)
    return err
}
```


## Category: injection

### Bind untrusted values into SQL statements as placeholders

**Use when**

Building a SQL query where any part of the statement comes from a bound struct field, path parameter, or query parameter.

**Secure rules**

**Rule 1: Pass request values as placeholder arguments, never as query text.**

Gin's binders check that a field is present and well typed, but a validated `string` is still arbitrary text. Building the statement with `fmt.Sprintf` or `+` lets a value such as `admin'--` change what it means. Give the query placeholders — `?` for MySQL and SQLite, `$1` for PostgreSQL — and pass the values as trailing arguments. Placeholders bind values only, not table or column names.

```go
type LoginRequest struct {
    Email string `json:"email" binding:"required,email"`
}

router.POST("/login", func(c *gin.Context) {
    var req LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
        return
    }
    var id int
    var hash string
    err := db.QueryRow(
        "SELECT id, password_hash FROM users WHERE email = ?", req.Email,
    ).Scan(&id, &hash)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"id": id})
})
```

**Rule 2: Map identifiers through a lookup defined in code when a placeholder cannot be used.**

Column names and sort directions are part of the statement's syntax, so the driver will not bind them. Translate the request value through a map or a `binding:"oneof=..."` tag and interpolate the resulting constant, which holds no caller-controlled text. Quoting or escaping the raw value instead is fragile and varies by database.

```go
var sortColumns = map[string]string{"name": "name", "created": "created_at"}

type ListQuery struct {
    SortBy string `form:"sort_by" binding:"omitempty,oneof=name created"`
}

router.GET("/products", func(c *gin.Context) {
    var q ListQuery
    if err := c.ShouldBindQuery(&q); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid sort"})
        return
    }
    column, ok := sortColumns[q.SortBy]
    if !ok {
        column = "name"
    }
    rows, err := db.Query(
        fmt.Sprintf("SELECT id, name FROM products ORDER BY %s LIMIT ?", column), 100,
    )
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "query failed"})
        return
    }
    defer rows.Close()
    // ... scan rows
})
```


### Invoke external programs as argument slices without a shell

**Use when**

Running an external tool where any argument comes from request data, such as a filename, URL, or hostname.

**Secure rules**

**Rule 1: Build commands with `exec.Command(name, args...)`, not a shell string.**

`exec.Command` executes the named binary directly, so `;`, `|`, backticks, and `$(...)` inside an argument are ordinary characters. Routing the same work through `exec.Command("sh", "-c", line)` reintroduces the interpreter, and a filename such as `report.pdf; rm -rf /var/data` then runs a second command. Where a pipeline is genuinely needed, connect two `exec.Cmd` values through `StdoutPipe`.

```go
router.POST("/convert", func(c *gin.Context) {
    source := c.PostForm("source")
    target := c.PostForm("target")

    cmd := exec.Command("convert", source, target) // separate arguments
    if err := cmd.Run(); err != nil {
        c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "conversion failed"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"output": target})
})
```

**Rule 2: Stop request-derived arguments from being read as options.**

Without a shell there is still the program's own flag parser: an argument beginning with `-` becomes an option and can redirect output or enable an unintended mode. Rejecting leading dashes is the guard that always works, so make that the check you rely on. `--` is a widely followed convention rather than a guaranteed one: `getopt`-based tools honour it, but `g++` and `gcc` reject it outright with `unrecognized command-line option '--'`, so adding it to a compiler invocation breaks a command that was working. Pass `--` only to a program documented to accept it, and keep your own flags ahead of it, since many tools are order-sensitive.

```go
router.GET("/reachability", func(c *gin.Context) {
    host := c.Query("host")
    if strings.HasPrefix(host, "-") {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid host"})
        return
    }
    cmd := exec.Command("ping", "-c", "1", "--", host) // our flags, then user data
    if err := cmd.Run(); err != nil {
        c.JSON(http.StatusOK, gin.H{"reachable": false})
        return
    }
    c.JSON(http.StatusOK, gin.H{"reachable": true})
})
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


### Encode untrusted data for the context the response places it in

**Use when**

Returning text, markup, or stored content that originated from a request, or writing request data into application logs.

**Secure rules**

**Rule 1: Serve stored user content with a non-executable content type.**

`c.Data(200, "text/html", body)` tells the browser to parse the bytes as markup, so stored `<script>` runs under your origin the next time somebody views it. `c.String`, `c.JSON`, or `c.Data` with `text/plain; charset=utf-8` render the same bytes as text. `X-Content-Type-Options: nosniff` stops the browser sniffing the body into a richer type, and `Content-Disposition: attachment` suits a download rather than a view.

```go
router.GET("/pages/:slug", func(c *gin.Context) {
    body := loadSubmittedPage(c.Param("slug")) // user-supplied, untrusted

    c.Header("X-Content-Type-Options", "nosniff")
    c.Data(http.StatusOK, "text/plain; charset=utf-8", body)
})
```

**Rule 2: Render HTML through `html/template` rather than concatenating strings.**

`html/template` tracks where each value lands — element text, attribute, URL, script block — and applies the escaping that context needs, which `fmt.Sprintf` cannot. Register templates with `LoadHTMLGlob` and render with `c.HTML`, passing untrusted values as data. `template.HTML`, `template.JS`, and `template.URL` switch escaping off, so reserve them for markup your own code produced. Outside a template, `template.HTMLEscapeString` covers text and quoted-attribute positions.

```go
router := gin.Default()
router.LoadHTMLGlob("templates/*.tmpl")

router.GET("/greet", func(c *gin.Context) {
    // html/template escapes name for whichever context the template uses it in.
    c.HTML(http.StatusOK, "greet.tmpl", gin.H{"name": c.Query("name")})
})
```

**Rule 3: Sanitize user-authored markup when the response must be `text/html`.**

An endpoint documented as returning `text/html` has to return it, so Rule 1 does not apply — a security rule hardens a specification rather than amending it. Rule 2 does not cover it either: `html/template` escapes values you interpolate into a template you control, not a whole page a user wrote. Run the stored markup through an allowlist sanitizer: `github.com/microcosm-cc/bluemonday` keeps the formatting tags the feature needs and drops `<script>`, `onload`-style handler attributes, and `javascript:` URLs. Where no sanitizer is available, `template.HTMLEscapeString` makes the page inert at the cost of showing its tags as text.

```go
import "github.com/microcosm-cc/bluemonday"

// Build the policy once at startup, not per request.
var ugcPolicy = bluemonday.UGCPolicy()

func registerPages(router *gin.Engine) {
    router.GET("/pages/:slug", func(c *gin.Context) {
        page, ok := loadSubmittedPage(c.Param("slug"))
        if !ok {
            c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
            return
        }
        c.Header("X-Content-Type-Options", "nosniff")
        // Keeps safe tags, drops scripts and handlers.
        c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(ugcPolicy.Sanitize(page)))
    })
}
```

**Rule 4: Serve a stored upload under an allowlisted content type, never the type sniffed from its bytes.**

Rules 1 to 3 govern a body you decided was markup; this one governs the case where the *content type itself* comes from the upload. `http.DetectContentType` on an attacker's file returns whatever that file looks like, so a `.html` upload comes back as `text/html` and echoing that type re-serves the attacker's script under your origin — the sniff is what makes it executable, even though the handler only ever meant to serve images. Match the detected or client-supplied type against the fixed set the endpoint exists to return and serve anything else as `application/octet-stream`. That keeps a genuine image on its real mimetype, so a documented "returns the image's content type" contract still holds. Treat `image/svg+xml` as markup rather than an image, because an SVG can carry script. Send `X-Content-Type-Options: nosniff` so the browser does not re-sniff past the type you chose.

```go
// The types this endpoint exists to serve. Anything else is a download.
var servableImageTypes = map[string]bool{
    "image/png": true, "image/jpeg": true, "image/gif": true, "image/webp": true,
}

func serveImage(c *gin.Context, body []byte, storedType string) {
    contentType := "application/octet-stream" // fail closed
    if servableImageTypes[strings.ToLower(strings.TrimSpace(storedType))] {
        contentType = storedType
    }

    c.Header("X-Content-Type-Options", "nosniff")
    c.Header("Content-Disposition", "inline")
    c.Data(http.StatusOK, contentType, body)
}
```

**Rule 5: Strip newline and control characters before writing request data to a log.**

A value containing `\n` or `\r` splits one log entry into two, letting a caller forge lines that appear to come from the server and push real events out of view. Replace line breaks and other control characters before logging, and cap the length so one request cannot flood the log.

```go
func sanitizeForLog(value string, limit int) string {
    cleaned := strings.Map(func(r rune) rune {
        if r == '\n' || r == '\r' || unicode.IsControl(r) {
            return ' '
        }
        return r
    }, value)
    if len(cleaned) > limit {
        cleaned = cleaned[:limit]
    }
    return cleaned
}

func registerEvents(router *gin.Engine) {
    router.POST("/events", func(c *gin.Context) {
        var req struct {
            Message string `json:"message" binding:"required"`
        }
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
            return
        }
        log.Printf("client event: %s", sanitizeForLog(req.Message, 200))
        c.JSON(http.StatusOK, gin.H{"status": "recorded"})
    })
}
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


### Bound request bodies and connection lifetimes at the server

**Use when**

Starting a Gin server and accepting request bodies of any kind.

**Secure rules**

**Rule 1: Cap request body reads with `http.MaxBytesReader`.**

`MaxMultipartMemory` only governs how much of a multipart form is buffered in RAM before the rest spills to temporary files; it caps neither the request overall nor JSON and raw bodies. Wrapping `c.Request.Body` before binding makes the read fail past the limit, so an unbounded upload is rejected instead of filling memory or disk. Applying it as middleware covers routes added later.

```go
func BodyLimit(maxBytes int64) gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBytes)
        c.Next()
    }
}

func main() {
    router := gin.Default()
    router.Use(BodyLimit(10 << 20)) // 10 MiB per request
}
```

**Rule 2: Set explicit timeouts on the `http.Server` rather than using `router.Run`.**

`router.Run` calls `http.ListenAndServe`, which leaves `ReadTimeout`, `WriteTimeout`, and `IdleTimeout` at zero — meaning no timeout at all. A client sending headers one byte at a time then holds file descriptors and goroutines indefinitely. Construct the `http.Server` yourself so slow and idle peers are disconnected; `ReadHeaderTimeout` bounds the header phase specifically.

```go
srv := &http.Server{
    Addr:              ":8080",
    Handler:           router,
    ReadHeaderTimeout: 5 * time.Second,
    ReadTimeout:       15 * time.Second,
    WriteTimeout:      30 * time.Second,
    IdleTimeout:       60 * time.Second,
}
if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
    log.Fatal(err)
}
```


### Bound work whose cost the caller controls

**Use when**

Running pattern matching, spawning an external process, or decompressing an archive using data from the request.

**Secure rules**

**Rule 1: Keep request-supplied patterns out of `regexp`, and cap the text they match against.**

Go's `regexp` implements RE2, which runs linear in the input and so avoids the exponential backtracking `(a+)+` causes elsewhere — useful, but not a complete defence, since cost stays linear in the product of pattern and subject size. Compile patterns once at startup, treat a caller-supplied needle as a literal with `regexp.QuoteMeta` or `strings.Contains`, and bound the subject length.

```go
const maxSubject = 1 << 20 // 1 MiB

router.GET("/search", func(c *gin.Context) {
    needle := c.Query("needle")
    haystack := loadDocument(c.Query("doc"))
    if len(haystack) > maxSubject {
        c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "content too large"})
        return
    }
    // The caller supplies text to find, not a pattern to compile.
    re := regexp.MustCompile(regexp.QuoteMeta(needle))
    c.JSON(http.StatusOK, gin.H{"matches": re.FindAllStringIndex(haystack, 100)})
})
```

**Rule 2: Give every external process a deadline with `exec.CommandContext`.**

`cmd.Run` waits as long as the child runs, so an input that makes a converter or decoder loop holds the goroutine, its pipes, and its file descriptors indefinitely. Deriving the command from a `context.WithTimeout` kills the process at the deadline, and checking `ctx.Err()` afterwards tells a timeout apart from an ordinary failure. `cmd.WaitDelay` additionally bounds how long `Wait` blocks when the child leaves an inherited pipe open after being signalled.

```go
router.POST("/thumbnails", func(c *gin.Context) {
    ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Second)
    defer cancel()

    cmd := exec.CommandContext(ctx, "convert", source, "-resize", "128x128", target)
    cmd.WaitDelay = 2 * time.Second
    err := cmd.Run()
    if ctx.Err() == context.DeadlineExceeded {
        c.JSON(http.StatusGatewayTimeout, gin.H{"error": "conversion timed out"})
        return
    }
    if err != nil {
        c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "conversion failed"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"output": target})
})
```

**Rule 3: Limit how many bytes an archive may expand to.**

Compression ratios above 1000:1 are easy to construct, so a few kilobytes of upload can expand into gigabytes and exhaust memory or disk. Copy each member through an `io.LimitReader` and track a running total, which enforces the limit on the bytes actually produced. `zip.File.UncompressedSize64` is a useful pre-check but is read from the archive itself and can be falsified.

```go
const maxTotalBytes = 50 << 20 // 50 MiB

func extractBounded(r *zip.ReadCloser, dst io.Writer) error {
    var written int64
    for _, f := range r.File {
        if f.FileInfo().IsDir() {
            continue
        }
        rc, err := f.Open()
        if err != nil {
            return err
        }
        n, err := io.Copy(dst, io.LimitReader(rc, maxTotalBytes-written))
        rc.Close()
        if err != nil {
            return err
        }
        written += n
        if written >= maxTotalBytes {
            return errors.New("archive expands beyond the allowed size")
        }
    }
    return nil
}
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


### Keep credentials out of source and store user secrets encrypted

**Use when**

Configuring credentials for a Gin application, or persisting secret values that users submit.

**Secure rules**

**Rule 1: Load credentials from the environment, and reserve `gin.BasicAuth` for fixed operator accounts.**

`gin.BasicAuth(gin.Accounts{...})` holds every password in cleartext, and writing that map as a literal commits credentials to source control and to every image built from it. Read the values from the environment for the few fixed accounts this middleware suits. For accounts end users register it is the wrong shape: authenticate against a stored password hash so no reversible credential exists on the server.

```go
router := gin.Default()

// A fixed operator account, credential supplied at deploy time.
admin := router.Group("/internal", gin.BasicAuth(gin.Accounts{
    os.Getenv("ADMIN_USER"): os.Getenv("ADMIN_PASSWORD"),
}))
admin.GET("/metrics", metricsHandler)

// End-user accounts authenticate against a stored hash, not this map.
router.POST("/login", loginWithPasswordHash)
```

**Rule 2: Encrypt recoverable secrets before writing them to storage.**

Some values have to be readable again — a stored API key, a token replayed to a third party — so hashing is not an option. Encrypt with an authenticated cipher and store only the ciphertext; AES-GCM also detects tampering, given a nonce never repeated under one key, which a fresh `crypto/rand` draw per message provides.

Resolve the key **once at startup**, never inside the handler, and never generate a random one as a fallback: it differs on each restart and across workers, so everything already stored becomes permanently unreadable — silent data loss that surfaces as a decrypt or authentication error. Where no dedicated key is configured, derive one deterministically from the application secret you already have.

```go
// Resolved once at startup, never per request.
var vaultKey = loadVaultKey()

func loadVaultKey() []byte {
    if raw := os.Getenv("VAULT_ENCRYPTION_KEY"); raw != "" {
        if key, err := base64.StdEncoding.DecodeString(raw); err == nil {
            return key
        }
    }
    // Deterministic derivation: stable across restarts and across workers.
    sum := sha256.Sum256([]byte("vault-encryption|" + os.Getenv("APP_SECRET")))
    return sum[:]
}

func encryptSecret(plaintext []byte) ([]byte, error) {
    block, err := aes.NewCipher(vaultKey) // 32 bytes for AES-256
    if err != nil {
        return nil, err
    }
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return nil, err
    }
    nonce := make([]byte, gcm.NonceSize())
    if _, err := rand.Read(nonce); err != nil {
        return nil, err
    }
    // Nonce is prefixed to the ciphertext so decryption can recover it.
    return gcm.Seal(nonce, nonce, plaintext, nil), nil
}
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
