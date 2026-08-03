# Security cards

Repository: `https://github.com/gofiber/fiber#v3.4.0`
Category: memory safety

## memory safety

### Prevent Memory Corruption and Data Races by Copying Pooled Context and Buffer References

**Use when**

When handling requests, passing context values or header slices to background goroutines, or retaining parsed data beyond request handler execution in Fiber.

**Secure rules**

**Rule 1: Avoid passing pooled fiber context or raw header slices to asynchronous goroutines without copying.**

Because Fiber context instances and request/response buffers are pooled and recycled across requests, passing `fiber.Ctx` or raw header slices directly into background goroutines causes data races and memory corruption. Obtain a standalone Go context using `c.Context()` or `c.SetContext()`, or explicitly copy string and byte slice references before retaining them outside the handler lifecycle.

```go
app.Get("/async", func(c fiber.Ctx) error {
  ctx := c.Context()
  go func(ctx context.Context) {
    doBackgroundWork(ctx)
  }(ctx)
  return c.SendStatus(fiber.StatusAccepted)
})
```
