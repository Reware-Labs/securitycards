# Security cards

Repository: `https://github.com/ktorio/ktor#3.5.1`
Category: secret handling

## secret handling

### Sanitize Sensitive Headers During Client Logging

**Use when**

Configuring client logging for Ktor HTTP requests and responses that contain sensitive authentication headers or tokens.

**Secure rules**

**Rule 1: Sanitize sensitive HTTP headers to prevent credential leakage into log files.**

When configuring the `Logging` plugin with `header` or `full` logging levels, use `sanitizeHeader` to redact sensitive headers like `Authorization` or custom secret headers before they are written to logs.

```kotlin
install(Logging) {
    level = LogLevel.HEADERS
    logger = Logger.DEFAULT
    sanitizeHeader("<redacted>") { headerName ->
        headerName.equals(HttpHeaders.Authorization, ignoreCase = true) || headerName.equals("X-Api-Key", ignoreCase = true)
    }
}
```
