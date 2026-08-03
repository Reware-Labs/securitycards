# Security cards

Repository: `https://github.com/gofiber/fiber#v3.4.0`
Category: configuration source integrity

## configuration source integrity

### Configure explicit and non-conflicting TLS certificate sources in ListenConfig

**Use when**

Configuring server TLS parameters and certificate management options in ListenConfig to ensure deterministic and unambiguous security configuration precedence.

**Secure rules**

**Rule 1: Avoid mixing AutoCertManager with manual certificate file paths or conflicting TLS configurations in ListenConfig.**

Use a single, unambiguous source for TLS credentials in ListenConfig to prevent initialization failures or precedence overrides. Providing an explicit TLSConfig object takes precedence and causes Fiber to ignore separate CertFile settings and TLSConfigFunc callbacks, and mixing AutoCertManager with manual paths results in errors like ErrAutoCertWithCertFile.

```go
err := app.Listen(":443", fiber.ListenConfig{
    AutoCertManager: &autocert.Manager{
        Prompt:     autocert.AcceptTOS,
        HostPolicy: autocert.HostWhitelist("example.com"),
    },
})
```

**Rule 2: Ensure security-sensitive configuration sources have deterministic precedence.**

Define explicit precedence for TLS settings and reject unexpected overrides or mixing of conflicting configuration mechanisms in ListenConfig.
