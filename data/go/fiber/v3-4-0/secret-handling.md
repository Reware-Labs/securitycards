# Security cards

Repository: `https://github.com/gofiber/fiber#v3.4.0`
Category: secret handling

## secret handling

### Enforce value redaction and secure secret configuration in middleware

**Use when**

Configuring encryption keys and ensuring proper value redaction in Fiber middleware components.

**Secure rules**

**Rule 1: Supply a stable base64 encoded secret key for cookie encryption**

Supply a stable, base64-encoded string in `Config.Key` that decodes to 16, 24, or 32 bytes for the `encryptcookie` middleware. Do not generate keys randomly on every startup, as this will invalidate existing user sessions.

```go
app.Use(encryptcookie.New(encryptcookie.Config{
    Key: os.Getenv("COOKIE_ENCRYPTION_KEY"),
}))
```


### Secure sensitive credentials and cookies during extraction and redirection

**Use when**

Extracting API keys, tokens, or handling authentication input and cookies in Fiber applications.

**Secure rules**

**Rule 1: Avoid extracting sensitive credentials from URL query parameters**

Do not extract API keys or session tokens from query parameters because they can be leaked in logs and browser history. Instead, use headers or cookies via extractors like `extractors.FromHeader` or `extractors.FromCookie`.

```go
app.Use(keyauth.New(keyauth.Config{
    Extractor: extractors.FromHeader("X-API-Key"),
}))
```

**Rule 2: Do not flash sensitive form inputs via redirect cookies**

Avoid calling `c.Redirect().WithInput()` on HTTP routes that process sensitive information like passwords, credentials, or session tokens, as this serializes raw input directly into client-side browser cookies.

```go
app.Post("/login", func(c fiber.Ctx) error {
    return c.Redirect().With("error", "Invalid login credentials").To("/login")
})
```
