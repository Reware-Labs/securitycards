# Security cards

Repository: `https://github.com/gofiber/fiber#v3.4.0`
Category: runtime environment hardening

## runtime environment hardening

### Isolate Prefork Application Instances in Dedicated Environments

**Use when**

Configuring Fiber runtime execution mode for production deployment to manage socket reuse and process isolation.

**Secure rules**

**Rule 1: Isolate prefork worker processes under dedicated service identities in restricted runtime boundaries or disable prefork for single-owner socket semantics.**

When deploying Fiber in production, avoid running prefork mode in shared-host or untrusted multi-tenant environments where local processes share network namespaces. If strict single-owner socket semantics are required, initialize Fiber normally without prefork flags.

```go
package main

import (
	"log"
	"github.com/gofiber/fiber/v3"
)

func main() {
	app := fiber.New()

	app.Get("/api/health", func(c fiber.Ctx) error {
		return c.SendString("OK")
	})

	// Standard single-process server start
	log.Fatal(app.Listen(":8080"))
}
```


### Keep CSRF Value Redaction Enabled in Production

**Use when**

Configuring CSRF middleware options for production deployment where diagnostic logging and error messages are active.

**Secure rules**

**Rule 1: Ensure `DisableValueRedaction` remains `false` in production to prevent sensitive tokens and storage keys from leaking in logs.**

Do not leave default development configurations or enable diagnostic value un-redaction (`DisableValueRedaction: true`) in production environments. Ensure `DisableValueRedaction` remains `false` so sensitive CSRF tokens and backend storage keys are properly redacted in error messages and diagnostic logs, preventing attackers from exploiting exposed tokens.

```go
app.Use(csrf.New(csrf.Config{
    CookieName:        "__Host-csrf_",
    CookieSecure:      true,
    CookieHTTPOnly:    true,
    CookieSameSite:    "Lax",
    CookieSessionOnly: true,
    Extractor:         extractors.FromHeader("X-Csrf-Token"),
    Session:           sessionStore,
    DisableValueRedaction: false,
}))
```
