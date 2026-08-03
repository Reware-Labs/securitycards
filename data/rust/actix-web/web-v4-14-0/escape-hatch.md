# Security cards

Repository: `https://github.com/actix/actix-web#web-v4.14.0`
Category: escape hatch

## escape hatch

### Restrict Unsafe Transport Features and Avoid dangerous-h2c in Production

**Use when**

Configuring network client transport capabilities and dependencies where transport-layer security features must be enforced instead of unencrypted bypasses.

**Secure rules**

**Rule 1: Do not enable the `dangerous-h2c` feature flag in production deployments.**

Ensure that `dangerous-h2c` is omitted from `Cargo.toml` dependencies so that unencrypted TCP streams are not wrapped as mock TLS connections. Only enable standard TLS features such as `rustls-0_23-webpki-roots` or `openssl` for network client communication.

```toml
[dependencies]
awc = { version = "3.5", features = ["rustls-0_23-webpki-roots"] }
```
