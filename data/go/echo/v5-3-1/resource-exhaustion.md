# Security cards

Repository: `https://github.com/labstack/echo#v5.3.1`
Category: resource exhaustion

## resource exhaustion

### Configure Request Size, Payload Limits, and Timeouts to Prevent Resource Exhaustion

**Use when**

Developing Echo web applications and handling incoming HTTP requests, multipart forms, compressed payloads, or long-running tasks.

**Secure rules**

**Rule 1: Limit request body sizes using BodyLimit middleware**

Configure Echo's `middleware.BodyLimit` or `middleware.BodyLimitWithConfig` on endpoints that process incoming request bodies to prevent memory exhaustion and denial-of-service attacks.

```go
e := echo.New()
e.Use(middleware.BodyLimit(2 * 1024 * 1024))
```

**Rule 2: Limit decompressed request payload size to prevent zip bomb DoS**

When enabling request decompression using Echo's Decompress middleware, ensure that `MaxDecompressedSize` is set to an appropriate limit for your application rather than disabled.

```go
e.Use(middleware.DecompressWithConfig(middleware.DecompressConfig{
	MaxDecompressedSize: 10 * 1024 * 1024,
}))
```

**Rule 3: Set request timeouts using ContextTimeout middleware**

Configure `middleware.ContextTimeout` or `middleware.ContextTimeoutWithConfig` with a positive duration to set strict execution deadlines on incoming requests and ensure backend operations respect context cancellation.

```go
e.Use(middleware.ContextTimeout(5 * time.Second))

e.GET("/items", func(c *echo.Context) error {
	items, err := repository.FindAll(c.Request().Context())
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, items)
})
```

**Rule 4: Configure HTTP server timeouts using BeforeServeFunc**

Use `BeforeServeFunc` to explicitly configure `ReadHeaderTimeout`, `WriteTimeout`, `IdleTimeout`, and `MaxHeaderBytes` on the underlying `http.Server` instance before listening.

```go
sc := echo.StartConfig{
	Address: ":8080",
	BeforeServeFunc: func(s *http.Server) error {
		s.ReadHeaderTimeout = 10 * time.Second
		s.WriteTimeout = 30 * time.Second
		s.IdleTimeout = 2 * time.Minute
		s.MaxHeaderBytes = 1 << 20
		return nil
	},
}
err := sc.Start(ctx, e)
```

**Rule 5: Configure multipart form parse memory limits explicitly**

Tune `formParseMaxMemory` on your Echo instance to align with server resource constraints when handling file uploads or large forms.

```go
e := echo.New()
e.SetFormParseMaxMemory(4 << 20)
```

**Rule 6: Configure RateLimiter middleware store and burst limits to prevent resource exhaustion**

Explicitly specify a `RateLimiterStore` such as `NewRateLimiterMemoryStoreWithConfig` with appropriate `Rate`, `Burst`, and `ExpiresIn` settings when configuring Echo's `RateLimiter` middleware.

```go
store := middleware.NewRateLimiterMemoryStoreWithConfig(middleware.RateLimiterMemoryStoreConfig{
	Rate:      10,
	Burst:     30,
	ExpiresIn: 3 * time.Minute,
})

e.Use(middleware.RateLimiterWithConfig(middleware.RateLimiterConfig{
	Store: store,
}))
```
