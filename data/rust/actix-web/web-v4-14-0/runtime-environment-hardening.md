# Security cards

Repository: `https://github.com/actix/actix-web#web-v4.14.0`
Category: runtime environment hardening

## runtime environment hardening

### Disable experimental features in production builds

**Use when**

Configuring crate dependencies and feature flags for production deployment

**Secure rules**

**Rule 1: Do not expose experimental-introspection reports in production because they can include sensitive configuration details**

Limit experimental-introspection to development or local diagnostic builds, or ensure its reports are not exposed in production.

```toml
[dev-dependencies]
actix-web = { version = "4.14.0", features = ["experimental-introspection"] }
```
