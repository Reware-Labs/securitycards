# Security cards

Repository: `https://github.com/gofiber/fiber#v3.4.0`
Category: session management

## session management

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


### Prevent XSS by Enforcing HTTPOnly Cookies, Proper MIME Sniffing Headers, and HTML Encoding

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
