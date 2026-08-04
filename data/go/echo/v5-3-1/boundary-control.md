# Security cards

Repository: `https://github.com/labstack/echo#v5.3.1`
Category: boundary control

## boundary control

### Register URL Rewrite Middleware Using Pre Instead Of Use

**Use when**

When registering URL rewrite middleware in Echo to ensure path transformations occur before route matching and route-level security enforcement.

**Secure rules**

**Rule 1: Register path rewriting middleware via `e.Pre()` rather than `e.Use()` so that request path modifications happen before route resolution and associated authorization checks.**

Using `e.Use()` causes Echo to resolve the route using the original request path prior to executing the rewrite logic, leading to potential security bypasses or handler mismatches. Always attach rewrite middleware using `e.Pre()`.

```go
e := echo.New()

// Register rewrite middleware using e.Pre() to rewrite the path before route resolution
e.Pre(middleware.RewriteWithConfig(middleware.RewriteConfig{
	Rules: map[string]string{
		"/old-path/*": "/new-path/$1",
	},
}))

e.GET("/new-path/*", func(c *echo.Context) error {
	return c.String(http.StatusOK, "Access Granted")
})
```
