# Security cards

Repository: `https://github.com/gofiber/fiber#v3.4.0`
Category: interface protocol hardening

## interface protocol hardening

### Restrict HTTP methods and content types to enforce protocol boundaries

**Use when**

When configuring Fiber application routing, global configurations, and middleware to process incoming HTTP requests strictly according to expected methods and content semantics.

**Secure rules**

**Rule 1: Enable GETOnly mode on read-only services to strictly reject non-GET requests and enforce protocol boundaries.**

Enable `GETOnly` inside `fiber.Config` on read-only microservices to ensure the application automatically rejects state-changing HTTP methods and maintains strict network protocol boundaries.

```go
app := fiber.New(fiber.Config{
    GETOnly: true,
})
```

**Rule 2: Restrict state modifications exclusively to unsafe HTTP methods and keep safe methods read-only.**

Do not perform state-changing operations inside handlers bound to HTTP methods classified as safe, such as `GET`, `HEAD`, `OPTIONS`, `TRACE`, and `QUERY`, because mechanisms like CSRF token validation and early data rejection bypass safety checks for these methods.

```go
app.Post("/user/update", func(c fiber.Ctx) error {
    return c.SendStatus(fiber.StatusOK)
})

app.Query("/items", func(c fiber.Ctx) error {
    return c.JSON(items)
})
```
