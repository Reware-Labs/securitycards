# Security cards

Repository: `https://github.com/ollama/ollama#v0.32.5`
Category: secret handling

## secret handling

### Redact Sensitive Environment Variables Before Logging Subprocess State

**Use when**

When logging execution environments or configuration maps for model runners that may contain sensitive credentials.

**Secure rules**

**Rule 1: Filter and redact sensitive key-value pairs containing API keys, tokens, secrets, or credentials before passing them to application logs.**

Sanitize environment variable keys and redact sensitive values using helper functions before passing them to loggers to prevent credential leakage in log output.

```go
func redactEnvValue(key, value string) string {
    for _, token := range []string{"API", "KEY", "TOKEN", "SECRET", "PASSWORD", "CREDENTIAL", "AUTH"} {
        if strings.Contains(strings.ToUpper(key), token) {
            return "[redacted]"
        }
    }
    return value
}
```
