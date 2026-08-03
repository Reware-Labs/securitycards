# Security cards

Repository: `https://github.com/vapor/vapor#4.122.0`
Documentation repository: `https://github.com/vapor/docs#main`
Category: network boundary

## network boundary

### Enforce TLS for Authentication Transports

**Use when**

When configuring network boundaries or routing endpoints that handle Basic authentication and credentials.

**Secure rules**

**Rule 1: Require encrypted transport across network boundaries for Basic authentication endpoints.**

Never transmit or accept Basic authentication credentials over plaintext connections. Ensure that HTTPS and TLS are strictly enforced at the network boundary or via reverse proxy configuration before routing authentication requests.

```swift
let protected = app.grouped(UserAuthenticator())
    .grouped(User.guardMiddleware())

protected.post(
```
