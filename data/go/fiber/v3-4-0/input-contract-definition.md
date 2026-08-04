# Security cards

Repository: `https://github.com/gofiber/fiber#v3.4.0`
Category: input contract definition

## input contract definition

### Enforce Input Validation Contracts During Request Binding in Fiber

**Use when**

Use when binding and validating incoming request parameters, query strings, headers, or body payloads to ensure input conforms to expected types, structures, and required field criteria before processing.

**Secure rules**

**Rule 1: Declare explicit required struct tags and validate binding errors to prevent zero-value bypasses.**

Explicitly declare the required tag option on struct fields when binding request inputs via `c.Bind()`. Always validate the return error of `c.Bind()` operations before relying on bound struct values to ensure missing or malformed parameters are rejected.

```go
type UserQuery struct {
    UserID int    `query:"user_id,required"`
    Role   string `query:"role"`
}

app.Get("/user", func(c fiber.Ctx) error {
    q := new(UserQuery)
    if err := c.Bind().Query(q); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing required user_id parameter"})
    }
    return c.SendString(fmt.Sprintf("User ID: %d", q.UserID))
})
```

**Rule 2: Configure a struct validator on the Fiber app instance for automatic input validation.**

Fiber automatically invokes `app.config.StructValidator` on destination structs after binding request parameters unless `SkipValidation(true)` is called on the binder chain. Configure an implementation of `StructValidator` on the Fiber application instance to enforce input validation contracts across bound structs.

```go
type CustomValidator struct{}

func (v *CustomValidator) Validate(out any) error {
	// Execute validator logic (e.g. using go-playground/validator)
	return nil
}

app := fiber.New(fiber.Config{
	StructValidator: &CustomValidator{},
})
```
