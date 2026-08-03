# Security cards

Repository: `https://github.com/salvo-rs/salvo#v0.94.0`
Category: input interpretation safety

## input interpretation safety

### Keep Strict Path Normalization Enabled to Prevent Path Confusion and Traversal

**Use when**

Configuring proxy routing in Salvo to handle upstream requests safely and prevent attackers from bypassing security controls via encoded or relative path components.

**Secure rules**

**Rule 1: Ensure strict path normalization remains enabled on proxy configurations to reject ambiguous path components and percent-encoded characters.**

Do not disable path normalization on proxy instances unless you have verified that the upstream target is completely immune to path traversal and path confusion vulnerabilities. Keep the normalization filter active so that literal relative path components and ambiguous percent-encoded characters are properly rejected before reaching the upstream server.

```rust
Proxy::new(upstreams, client).strict_path_normalization(true)
```
