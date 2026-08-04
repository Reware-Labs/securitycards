# Security cards

Repository: `https://github.com/gin-gonic/gin#v1.12.0`
Category: session management

## session management

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
