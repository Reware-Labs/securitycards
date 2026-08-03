# Security cards

Repository: `https://github.com/gofiber/fiber#v3.4.0`
Category: access control

## access control

### Enforce Early Return on Authorization Failure in Middleware

**Use when**

Implementing authentication or access control middleware in a Fiber route chain to protect endpoints against unauthorized access.

**Secure rules**

**Rule 1: Abort middleware execution immediately upon authorization failure without calling c.Next()**

When checking access control in a Fiber middleware handler, ensure that failing the check returns an error or a status response directly without invoking `c.Next()`. Calling `c.Next()` after a failed check allows control to flow into downstream handlers and bypasses security protections.

```go
app.Get("/protected/resource",
    func(c fiber.Ctx) error {
        if c.Get("Authorization") == "" {
            return c.SendStatus(fiber.StatusUnauthorized)
        }
        return c.Next()
    },
    func(c fiber.Ctx) error {
        return c.SendString("Sensitive data")
    },
)
```
