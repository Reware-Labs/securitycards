# Security cards

Repository: `https://github.com/gofiber/fiber#v3.4.0`
Category: output encoding

## output encoding

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

### Encode untrusted data for the context the response places it in

**Use when**

Returning text, markup, or stored content that originated from a request, or writing request data into application logs.

**Secure rules**

**Rule 1: Serve stored user content with a non-executable content type.**

Sending a stored value as `text/html` tells the browser to parse the bytes as markup, so a stored `<script>` runs under your origin the next time somebody views it. Setting `text/plain; charset=utf-8` renders the same bytes as text. `X-Content-Type-Options: nosniff` stops the browser sniffing the body into a richer type, and `Content-Disposition: attachment` suits a download rather than a view.

```go
app.Get("/pages/:slug", func(c fiber.Ctx) error {
    body := loadSubmittedPage(c.Params("slug")) // user-supplied, untrusted

    c.Set("X-Content-Type-Options", "nosniff")
    c.Set("Content-Type", "text/plain; charset=utf-8")
    return c.Send(body)
})
```

**Rule 2: Render HTML through `html/template` rather than concatenating strings.**

`html/template` tracks where each value lands — element text, attribute, URL, script block — and applies the escaping that context needs, which `fmt.Sprintf` cannot. Parse templates once at startup and pass untrusted values in as data. `template.HTML`, `template.JS`, and `template.URL` switch escaping off, so reserve them for markup your own code produced. Outside a template, `template.HTMLEscapeString` covers text and quoted-attribute positions.

```go
// Authored by us, parsed once at startup.
var greetTmpl = template.Must(template.ParseFiles("templates/greet.tmpl"))

app.Get("/greet", func(c fiber.Ctx) error {
    var buf bytes.Buffer
    // html/template escapes name for whichever context the template uses it in.
    if err := greetTmpl.Execute(&buf, map[string]string{"Name": c.Query("name")}); err != nil {
        return c.SendStatus(fiber.StatusInternalServerError)
    }
    c.Set("Content-Type", "text/html; charset=utf-8")
    return c.Send(buf.Bytes())
})
```

**Rule 3: Sanitize user-authored markup when the response must be `text/html`.**

An endpoint documented as returning `text/html` has to return it, so Rule 1 does not apply — a security rule hardens a specification rather than amending it. Rule 2 does not cover it either: `html/template` escapes values you interpolate into a template you control, not a whole page a user wrote. Run the stored markup through an allowlist sanitizer: `github.com/microcosm-cc/bluemonday` keeps the formatting tags the feature needs and drops `<script>`, `onload`-style handler attributes, and `javascript:` URLs. Where no sanitizer is available, `template.HTMLEscapeString` makes the page inert at the cost of showing its tags as text.

```go
import "github.com/microcosm-cc/bluemonday"

// Build the policy once at startup, not per request.
var ugcPolicy = bluemonday.UGCPolicy()

app.Get("/pages/:slug", func(c fiber.Ctx) error {
    page, ok := loadSubmittedPage(c.Params("slug"))
    if !ok {
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "not found"})
    }
    c.Set("X-Content-Type-Options", "nosniff")
    c.Set("Content-Type", "text/html; charset=utf-8")
    // Keeps safe tags, drops scripts and handlers.
    return c.SendString(ugcPolicy.Sanitize(page))
})
```

**Rule 4: Strip newline and control characters before writing request data to a log.**

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

app.Post("/events", func(c fiber.Ctx) error {
    var req struct {
        Message string `json:"message"`
    }
    if err := c.Bind().JSON(&req); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request"})
    }
    log.Printf("client event: %s", sanitizeForLog(req.Message, 200))
    return c.JSON(fiber.Map{"status": "recorded"})
})
```
