# Security cards

Repository: `https://github.com/gofiber/fiber#v3.4.0`
Category: boundary control

## boundary control

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
