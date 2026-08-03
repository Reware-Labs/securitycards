# Security cards

Repository: `https://github.com/vapor/vapor#4.122.0`
Documentation repository: `https://github.com/vapor/docs#main`
Category: csrf

## csrf

### Configure SameSite session cookies to mitigate cross-site request forgery

**Use when**

Configuring session middleware and cookie factories for routes that use ambient credentials and state-changing actions.

**Secure rules**

**Rule 1: Configure explicit SameSite cookie policies on session cookies to prevent unauthorized cross-site request forgery.**

Set `app.sessions.configuration.cookieFactory` to explicitly define `sameSite: .lax` or `sameSite: .strict` alongside `isSecure` and `httpOnly` flags when using `SessionsMiddleware` in Vapor.

```swift
app.sessions.configuration.cookieFactory = { id in
    HTTPCookies.Value(
        string: id.string,
        isSecure: true,
        httpOnly: true,
        sameSite: .lax
    )
}
app.middleware.use(app.sessions.middleware)
```
