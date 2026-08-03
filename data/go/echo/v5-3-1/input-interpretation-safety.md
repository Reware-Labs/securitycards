# Security cards

Repository: `https://github.com/labstack/echo#v5.3.1`
Category: input interpretation safety

## input interpretation safety

### Configure Secure CORS Origins and Dynamic Origin Validation

**Use when**

Configuring cross-origin resource sharing for Echo web applications using explicit allow lists or dynamic origin callback validation.

**Secure rules**

**Rule 1: Ensure allowed origins include explicit schemes and hostnames.**

Echo's CORS middleware validates origin strings during initialization and rejects configuration entries in `AllowOrigins` that lack an explicit URL scheme such as `http://` or `https://`. Origin matching strictly enforces exact scheme matching during preflight and request evaluation, treating different schemes as distinct origins.

```go
e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
	AllowOrigins: []string{"https://example.com", "https://api.example.com"},
}))
```

**Rule 2: Use UnsafeAllowOriginFunc for secure dynamic subdomain origin validation.**

When dynamic cross-origin validation is required with credentials, configure `UnsafeAllowOriginFunc` in `CORSConfig`. Perform strict scheme, host, and port matching rather than weak string suffix or prefix checks to prevent attacker-registered domains from bypassing CORS restrictions.

```go
e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
	UnsafeAllowOriginFunc: func(c *echo.Context, origin string) (string, bool, error) {
		if origin == "https://trusted.example.com" || origin == "https://api.example.com" {
			return origin, true, nil
		}
		return "", false, nil
	},
	AllowCredentials: true,
}))
```


### Normalize URL paths and handle encoded characters during routing and rewrites

**Use when**

When registering pre-routing slash middleware or defining URL rewrite rules in Echo applications where input path representation variations could cause routing bypasses or parsing differentials.

**Secure rules**

**Rule 1: Register path normalization middleware using e.Pre() to process requests before routing decisions.**

Always register `AddTrailingSlash` or `RemoveTrailingSlash` middleware using `e.Pre()` rather than `e.Use()`. Pre-routing registration ensures that URL path normalization occurs before Echo matches routes, establishing a single unambiguous path interpretation.

```go
e := echo.New()
e.Pre(middleware.AddTrailingSlash())
```

**Rule 2: Account for URL encoding variations in custom rewrite rules to prevent parser bypasses.**

When defining regex-based URL rewrite rules in Echo middleware, ensure rules account for URL encoding variations or canonical paths. Encoded path characters in request URLs will not match literal regex patterns designed for unencoded paths, which can lead to routing mismatches and policy bypasses.

```go
e.Use(middleware.Rewrite(map[*regexp.Regexp]string{
	regexp.MustCompile("^/users/(.*?)/orders/(.*?)$"): "/user/$1/order/$2",
}))
```
