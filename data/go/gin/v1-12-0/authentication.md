# Security cards

Repository: `https://github.com/gin-gonic/gin#v1.12.0`
Category: authentication

## authentication

### Authenticate incoming requests using Gin basic authentication middleware

**Use when**

Implementing credential verification and establishing user identity for protected HTTP routes using built-in authentication middleware.

**Secure rules**

**Rule 1: Validate credentials using BasicAuth and retrieve authenticated identities exclusively via the context key.**

Use `gin.BasicAuth` with a populated accounts map to validate incoming credentials securely using constant-time comparisons. Downstream handlers must retrieve the verified identity exclusively from `c.MustGet(gin.AuthUserKey)` or `c.Get(gin.AuthUserKey)` to ensure the request has successfully passed authentication.

```go
router := gin.Default()

authorized := router.Group("/admin", gin.BasicAuth(gin.Accounts{
    "admin": "SecretPassword123!",
}))

authorized.GET("/dashboard", func(c *gin.Context) {
    user := c.MustGet(gin.AuthUserKey).(string)
    c.String(http.StatusOK, "Hello %s", user)
})
```
