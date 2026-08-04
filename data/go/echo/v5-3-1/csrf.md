# Security cards

Repository: `https://github.com/labstack/echo#v5.3.1`
Category: csrf

## csrf

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
