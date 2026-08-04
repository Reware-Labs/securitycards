# Security cards

Repository: `https://github.com/ktorio/ktor#3.5.1`
Category: csrf

## csrf

### Configure Origin and Header Validation in Ktor CSRF Plugin

**Use when**

When implementing cross-site request forgery protection for state-changing HTTP requests using Ktor's CSRF plugin.

**Secure rules**

**Rule 1: Explicitly configure allowed origins and header validation rules when installing the CSRF plugin to prevent rejecting valid production requests or leaving endpoints vulnerable.**

Use `allowOrigin`, `originMatchesHost`, or `checkHeader` within the `CSRF` plugin configuration block to validate incoming state-changing requests. Ensure proper predicate checks or trusted origins are defined to protect state-modifying endpoints such as POST or PUT while safely ignoring safe methods.

```kotlin
route("/api") {
    install(CSRF) {
        allowOrigin("https://app.example.com")
        originMatchesHost()
        checkHeader("X-CSRF-Token") { token ->
            token == "expected-valid-token"
        }
    }
}
```
