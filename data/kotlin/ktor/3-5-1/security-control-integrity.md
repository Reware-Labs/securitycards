# Security cards

Repository: `https://github.com/ktorio/ktor#3.5.1`
Category: security control integrity

## security control integrity

### Avoid Authentication Bypass via Loose SkipWhen Conditions

**Use when**

When configuring authentication providers and routing paths where certain requests need to be treated as public or excluded from authentication requirements.

**Secure rules**

**Rule 1: Avoid relying on `skipWhen` conditions with untrusted request parameters to bypass authentication checks.**

Do not use loose or untrusted request inputs such as request URIs or headers inside `skipWhen` conditions within authentication provider configurations because this can bypass authentication completely. Instead, define public routes entirely outside the `authenticate` routing DSL block.

```kotlin
routing {
    get("/public") {
        call.respondText("Public content")
    }
    authenticate {
        get("\/secure") {
            call.respondText("Protected content")
        }
    }
}
```
