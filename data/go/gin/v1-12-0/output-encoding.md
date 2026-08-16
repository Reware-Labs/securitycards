# Security cards

Repository: `https://github.com/gin-gonic/gin#v1.12.0`
Category: output encoding

## output encoding

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
