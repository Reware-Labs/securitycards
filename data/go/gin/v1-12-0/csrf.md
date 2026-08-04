# Security cards

Repository: `https://github.com/gin-gonic/gin#v1.12.0`
Category: csrf

## csrf

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
