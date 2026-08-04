# Security cards

Repository: `https://github.com/gin-gonic/gin#v1.12.0`
Category: input interpretation safety

## input interpretation safety

### Configure UseEscapedPath to prevent route parameter decoding ambiguity

**Use when**

When routing needs to evaluate raw percent-encoded request paths rather than unescaped paths to prevent validation and policy bypass.

**Secure rules**

**Rule 1: Configure router.UseEscapedPath = true when routing needs to evaluate raw percent-encoded request paths.**

Set `router.UseEscapedPath = true` and `UnescapePathValues = false` during router setup to ensure percent-encoded characters like `%25` or `%2F` are preserved during route matching and parameter extraction, preventing path bypasses.

```go
router := gin.New()
router.UseEscapedPath = true
router.UnescapePathValues = false

router.GET("/v1/:path", func(c *gin.Context) {
    pathParam := c.Param("path")
    c.String(200, pathParam)
})
```
