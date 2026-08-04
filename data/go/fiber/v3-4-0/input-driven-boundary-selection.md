# Security cards

Repository: `https://github.com/gofiber/fiber#v3.4.0`
Category: input driven boundary selection

## input driven boundary selection

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
