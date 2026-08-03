# Security cards

Repository: `https://github.com/goadesign/goa#v3.28.0`
Documentation repository: `https://github.com/goadesign/goa.design#main`
Category: session management

## session management

### Configure Secure and HTTPOnly Attributes on Response Cookies

**Use when**

Mapping response cookies in Goa HTTP DSL to protect session identifiers and sensitive state from eavesdropping and client-side script access.

**Secure rules**

**Rule 1: Explicitly set security attributes on response cookies using `CookieSecure()` and `CookieHTTPOnly()`.**

When defining response cookies in the Goa HTTP DSL, ensure that session tokens and sensitive state enforce secure transmission and prevent client-side script access by explicitly including `CookieSecure()` and `CookieHTTPOnly()`.

```go
var _ = Service("account", func() {
    Method("login", func() {
        Result(Account)
        HTTP(func() {
            Response(StatusOK, func() {
                Cookie("session:SID", String, func() {
                    Format(FormatGUID)
                })
                CookieMaxAge(3600)
                CookiePath("/session")
                CookieSecure()
                CookieHTTPOnly()
            })
        })
    })
})
```
