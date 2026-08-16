# Security cards

Repository: `https://github.com/gin-gonic/gin#v1.12.0`
Category: access control

## access control

### Return Immediately After Aborting Request in Auth Middleware

**Use when**

When implementing authentication or authorization middleware in Gin to prevent unauthorized actions and enforce access control.

**Secure rules**

**Rule 1: Explicitly return after invoking abort methods in authorization middleware.**

Calling `c.Abort()`, `c.AbortWithStatus()`, or `c.AbortWithError()` prevents downstream handlers from executing, but it does not terminate the current handler function immediately. You must explicitly invoke `return` after calling abort methods to ensure that subsequent security checks or sensitive code inside that same middleware function do not continue to execute.

```go
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        if !isAuthorized(c.Request) {
            c.AbortWithStatus(http.StatusUnauthorized)
            return // Stop execution of the current handler immediately
        }
        c.Next()
    }
}
```


### Take the acting identity from the verified credential

**Use when**

A handler reads or modifies data belonging to a specific user and the request also carries a username, account id, or email.

**Secure rules**

**Rule 1: Read the subject from the context value the middleware set, not the payload.**

An identifier in the request says who the caller *claims* to be; only the verified token says who they are. Binding `owner` from the body lets any authenticated caller reach anyone else's data by editing one field. Store the verified subject with `c.Set`, read it with `c.Get`, and key every lookup on it. Where the contract carries the identifier too, compare and reject with `403`.

```go
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        username, err := verifyToken(c.GetHeader("Authorization"))
        if err != nil {
            c.AbortWithStatus(http.StatusUnauthorized)
            return
        }
        c.Set("currentUser", username) // the only trusted source of identity
        c.Next()
    }
}

func registerNotes(router *gin.Engine) {
    router.POST("/notes", func(c *gin.Context) {
        var req struct {
            Owner string `json:"owner" binding:"required"`
            Body  string `json:"body" binding:"required"`
        }
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
            return
        }
        currentUser := c.GetString("currentUser")
        if req.Owner != currentUser {
            c.AbortWithStatusJSON(http.StatusForbidden,
                gin.H{"error": "cannot act on behalf of another user"})
            return
        }
        saveNote(currentUser, req.Body) // keyed by the verified identity
        c.JSON(http.StatusOK, gin.H{"status": "created"})
    })
}
```

**Rule 2: Register the authorization middleware on a route group.**

Authorization applied handler by handler is only as complete as the last route somebody added, and a `GET` filtered by a query parameter is as exploitable as an unguarded `POST`. A `router.Group` makes every route inherit it, so protection is the default. Scope the query by the authenticated subject as well, and prefer `404` over `403` where the record's existence is sensitive.

```go
router := gin.Default()

authorized := router.Group("/", AuthMiddleware()) // applies to every route below
authorized.GET("/notes", func(c *gin.Context) {
    records, ok := loadNotes(c.GetString("currentUser")) // scoped, not filtered after
    if !ok {
        c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"notes": records})
})
```
