# Security cards

Repository: `https://github.com/gofiber/fiber#v3.4.0`
Category: input interpretation safety

## input interpretation safety

### Control URL path unescaping and parameter binding sources to prevent parsing ambiguity

**Use when**

When configuring application routing paths or binding request parameters where inconsistent decoding or ambiguous parameter origins could lead to alternate interpretations.

**Secure rules**

**Rule 1: Leave `UnescapePath` disabled unless routes require decoded URL-encoded characters**

`UnescapePath` defaults to `false`. When enabled, Fiber decodes encoded characters before route matching and exposes the decoded values through the request path and route parameters. Keep the default setting when the application does not require routes to match URL-encoded special characters.

```go
app := fiber.New(fiber.Config{
	UnescapePath: false,
})
```

**Rule 2: Use explicit binding methods instead of binding all sources when strict parameter origin is required.**

Avoid using `b.All()` when parameter values must come from a designated request source, as it sequentially falls back across URI parameters, request bodies, query parameters, headers, and cookies.

```go
app.Post("/users", func(c fiber.Ctx) error {
	var req CreateUserRequest
	// Use explicit JSON binding to ensure parameters are read only from body
	if err := c.Bind().JSON(&req); err != nil {
		return err
	}
	return c.JSON(req)
})
```
