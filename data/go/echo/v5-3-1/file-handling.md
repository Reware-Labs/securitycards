# Security cards

Repository: `https://github.com/labstack/echo#v5.3.1`
Category: file handling

## file handling

### Safely serve static assets using Echo's built-in path resolution

**Use when**

Serving static files and assets through Echo middleware or route groups while preventing path traversal vulnerabilities.

**Secure rules**

**Rule 1: Rely on Echo's built-in file path resolution and static middleware configuration without manually unescaping request URL paths.**

When serving static assets using `StaticWithConfig` or group-level `Static` methods, rely on Echo's built-in file path resolution rather than performing manual path unescaping or custom string concatenation. Echo's static middleware automatically sanitizes and rejects path traversal variants like backslashes, percent-encoded sequences, and mixed slashes. Avoid manual decoding of `c.Request().URL.Path` before performing filesystem lookups.

```go
e := echo.New()
e.Use(middleware.StaticWithConfig(middleware.StaticConfig{
	Root:       "public",
	Filesystem: os.DirFS("dist"),
}))
```

**Rule 2: Keep directory browsing disabled in production environments.**

Keep the `Browse` field in `StaticConfig` set to `false` unless directory index listing is explicitly intended for public consumption. Do not enable browsing on sensitivity-restricted or internal file structures to prevent full directory content disclosure and potential information leaks.

```go
e := echo.New()
// Secure default: Browse is false
e.Use(middleware.StaticWithConfig(middleware.StaticConfig{
    Root:   "public",
    Browse: false, // Ensure browsing remains disabled in production
}))
```
