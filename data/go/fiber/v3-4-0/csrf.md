# Security cards

Repository: `https://github.com/gofiber/fiber#v3.4.0`
Category: csrf

## csrf

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
