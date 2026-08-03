# Security cards

Repository: `https://github.com/gofiber/fiber#v3.4.0`
Category: resource exhaustion

## resource exhaustion

### Configure Request Body Limits and Timeouts to Prevent Resource Exhaustion

**Use when**

When initializing Fiber applications and handling incoming HTTP requests or background operations that require strict bounds on payload size and execution time.

**Secure rules**

**Rule 1: Configure an explicit BodyLimit in fiber.Config to restrict incoming request payload sizes.**

Define `BodyLimit` when initializing Fiber with `fiber.New()` to restrict maximum request payload sizes, protecting your server against memory and disk space exhaustion. Requests exceeding this limit receive an HTTP 413 error status.

```go
app := fiber.New(fiber.Config{
    BodyLimit: 2 * 1024 * 1024, // Restrict maximum payload size to 2MB
})
```

**Rule 2: Enforce request deadlines using explicit context timeouts on long-running tasks.**

Wrap handler contexts with `context.WithTimeout` and monitor `ctx.Done()` to cancel lingering background operations and prevent resource exhaustion when handling requests in Fiber.

```go
app.Get("/job", func(c fiber.Ctx) error {
    ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
    defer cancel()
    if err := doWork(ctx); err != nil {
        return c.Status(fiber.StatusGatewayTimeout).SendString("timeout")
    }
    return c.SendStatus(fiber.StatusOK)
})
```


### Enable Response Body Streaming and Shared Storage for Clients and Rate Limiting

**Use when**

When building applications that download large payloads using Fiber's HTTP client or enforce distributed rate limiting across multiple server instances.

**Secure rules**

**Rule 1: Enable response body streaming when handling large HTTP client responses.**

Set `SetStreamResponseBody(true)` on the HTTP client and consume responses incrementally via `resp.BodyStream()` to prevent loading large payloads entirely into memory, ensuring you call `defer resp.Close()` afterwards.

```go
cc := client.New()
cc.SetStreamResponseBody(true)

resp, err := cc.Get("https://example.com/large-file")
if err != nil {
    return err
}
defer resp.Close()

if resp.IsStreaming() {
    reader := resp.BodyStream()
    buf := make([]byte, 4096)
    for {
        n, err := reader.Read(buf)
        if n > 0 {
            // Process chunk safely
        }
        if err == io.EOF {
            break
        }
        if err != nil {
            return err
        }
    }
}
```

**Rule 2: Configure Shared Storage for Multi-Process Rate Limiting.**

Assign a centralized backend such as Redis or Memcached to the `Storage` field in `limiter.Config` when deploying applications across multiple server instances to prevent clients from bypassing local in-memory rate limits.

```go
app.Use(limiter.New(limiter.Config{
    Max:        20,
    Expiration: 30 * time.Second,
    Storage:    customRedisStorage,
}))
```
