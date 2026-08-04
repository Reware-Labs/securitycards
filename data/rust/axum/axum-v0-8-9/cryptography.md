# Security cards

Repository: `https://github.com/tokio-rs/axum#axum-v0.8.9`
Category: cryptography

## cryptography

### Use signed or private cookie jars for sensitive data

**Use when**

Handling sensitive session state, tokens, or confidential data in client cookies using axum-extra.

**Secure rules**

**Rule 1: Enable signed or private cookie jars to enforce cryptographic integrity and encryption on cookies.**

Add the appropriate features to `Cargo.toml` for `axum-extra` and extract cookies using `SignedCookieJar` or `PrivateCookieJar` instead of a plain `CookieJar` to prevent tampering and unauthorized reading.

```toml
axum-extra = { version = "0.9", features = ["cookie-signed", "cookie-private"] }
```
