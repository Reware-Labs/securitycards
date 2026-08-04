# Security cards

Repository: `https://github.com/gin-gonic/gin#v1.12.0`
Category: api contract misuse

## api contract misuse

### Validate HTTP status codes before invoking redirect renderers

**Use when**

When rendering redirects using `render.Redirect` within a Gin application.

**Secure rules**

**Rule 1: Ensure HTTP status codes passed to `render.Redirect` are strictly valid redirect status codes.**

Always pass standard HTTP status constants from `net/http` such as `http.StatusFound`, `http.StatusMovedPermanently`, or `http.StatusTemporaryRedirect` when constructing `render.Redirect` to avoid runtime panics caused by unpermitted status codes.

```go
func handleRedirect(c *gin.Context) {
    code := http.StatusFound
    redirect := render.Redirect{
        Code:     code,
        Request:  c.Request,
        Location: "/dashboard",
    }
    c.Render(code, redirect)
}
```
