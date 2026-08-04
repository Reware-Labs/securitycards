# Security cards

Repository: `https://github.com/gofiber/fiber#v3.4.0`
Category: api contract misuse

## api contract misuse

### Properly Handle Binding Errors and Return Errors from Binding Methods

**Use when**

Parsing and binding incoming request data using `c.Bind()`.

**Secure rules**

**Rule 1: Inspect binding errors using `errors.As` and `*fiber.BindError` to safely extract fields without leaking internal backend traces.**

Always check for `*fiber.BindError` when handling binding failures so you can inspect `be.Field` and `be.Source` safely.

```go
app.Post("/data", func(c fiber.Ctx) error {
    req := new(DataRequest)
    if err := c.Bind().Body(req); err != nil {
        var be *fiber.BindError
        if errors.As(err, &be) {
            return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
                "error": "validation_failed",
                "field": be.Field,
                "source": be.Source.String(),
            })
        }
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid input"})
    }
    return c.SendStatus(fiber.StatusOK)
})
```

**Rule 2: Always explicitly return errors returned by Fiber binding methods.**

Even when auto-handling is enabled via `WithAutoHandling()`, you must explicitly return the error to abort handler execution and prevent processing with unpopulated structs.

```go
app.Post("/profile", func(c fiber.Ctx) error {
	var req UpdateProfileReq
	if err := c.Bind().WithAutoHandling().JSON(&req); err != nil {
		return err
	}
	return c.SendString("Updated")
})
```
