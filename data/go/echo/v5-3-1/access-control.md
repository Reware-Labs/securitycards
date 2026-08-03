# Security cards

Repository: `https://github.com/labstack/echo#v5.3.1`
Category: access control

## access control

### Verify Authentication Context Explicitly Before Processing Protected Requests

**Use when**

When building route handlers with middleware such as KeyAuth that allows requests to continue even when authentication fails or is absent.

**Secure rules**

**Rule 1: Verify whether the request is authenticated inside the route handler when using authentication middleware configured to continue on ignored errors.**

When `ContinueOnIgnoredError: true` is enabled in `KeyAuthConfig`, unauthenticated requests can reach downstream handlers if `ErrorHandler` returns `nil`. You must explicitly check whether the authentication context key exists before serving sensitive content or performing privileged actions.

```go
config := middleware.KeyAuthConfig{
	Validator: func(c *echo.Context, key string, source middleware.ExtractorSource) (bool, error) {
		if key == "valid-key" {
			c.Set("user", "authenticated_user")
			return true, nil
		}
		return false, nil
	},
	ErrorHandler: func(c *echo.Context, err error) error {
		return nil
	},
	ContinueOnIgnoredError: true,
}

e.GET("/resource", func(c *echo.Context) error {
	user := c.Get("user")
	if user == nil {
		return c.String(http.StatusOK, "Public content")
	}
	return c.String(http.StatusOK, "Secret user content")
}, middleware.KeyAuthWithConfig(config))
```
