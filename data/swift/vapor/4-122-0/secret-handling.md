# Security cards

Repository: `https://github.com/vapor/vapor#4.122.0`
Documentation repository: `https://github.com/vapor/docs#main`
Category: secret handling

## secret handling

### Load sensitive credentials and secrets securely from environment variables or secret files

**Use when**

When loading API keys, cryptographic secrets, or database credentials in Vapor route handlers and configuration setups.

**Secure rules**

**Rule 1: Fetch secrets dynamically using environment variables or secret helper functions instead of hardcoding them in source code.**

Avoid hardcoding secrets directly in configuration files or route handlers. Instead, fetch sensitive credentials dynamically using `Environment.get` or Vapor's `Environment.secret(path:)` helper to prevent accidental exposure in repositories or build artifacts.

```swift
guard let secret = Environment.get("JWT_SECRET") else {
    fatalError("JWT_SECRET environment variable is not configured")
}
await app.jwt.keys.add(hmac: secret, digestAlgorithm: .sha256)
```
