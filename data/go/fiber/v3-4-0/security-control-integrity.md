# Security cards

Repository: `https://github.com/gofiber/fiber#v3.4.0`
Category: security control integrity

## security control integrity

### Register Security Controls and Middleware Globally and in Correct Order

**Use when**

When initializing application middleware and setting up global security controls in Fiber to ensure protections remain enabled, correctly ordered, and consistently applied across all execution paths including error responses.

**Secure rules**

**Rule 1: Register security middleware globally before handling requests to ensure security response headers and protection controls are consistently preserved.**

Always attach core security middleware such as `cors.New()` and `helmet.New()` on the Fiber application instance globally before defining routes and processing requests. This ensures that response headers and defenses remain applied even when requests trigger errors or exceed limits.

```go
app := fiber.New(fiber.Config{
    BodyLimit: 4 * 1024 * 1024,
})

// Apply security middleware globally
app.Use(cors.New(cors.Config{
    AllowOrigins: []string{"https://example.com"},
    AllowCredentials: true,
}))
app.Use(helmet.New())

app.Post("/upload", func(c fiber.Ctx) error {
    return c.SendStatus(fiber.StatusOK)
})
```

**Rule 2: Register encryptcookie middleware prior to any dependent cookie middleware that inspects or modifies cookies.**

Ensure `encryptcookie` is registered before downstream cookie-reading middleware like `csrf` runs, so that the downstream middleware receives decrypted plaintext rather than raw ciphertext.

```go
app.Use(encryptcookie.New(encryptcookie.Config{
    Key: os.Getenv("COOKIE_ENCRYPTION_KEY"),
    Except: []string{csrf.ConfigDefault.CookieName},
}))
app.Use(csrf.New(csrf.Config{
    Extractor: csrf.FromHeader(csrf.HeaderName),
}))
```
