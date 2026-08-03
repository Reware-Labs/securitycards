# Security cards

Repository: `https://github.com/vapor/vapor#4.122.0`
Documentation repository: `https://github.com/vapor/docs#main`
Category: interface protocol hardening

## interface protocol hardening

### Enforce RFC-Compliant Case-Insensitive Header Matching Using Typed Constants

**Use when**

Handling incoming HTTP request headers or setting outgoing response headers where case sensitivity could lead to protocol confusion or security control bypasses.

**Secure rules**

**Rule 1: Use HTTPHeaders.Name typed constants or string literals for case-insensitive header lookups and modifications.**

Access headers through `HTTPHeaders` using predefined `HTTPHeaders.Name` constants or standard string literal indexing. This automatically converts header names to lowercase for hashing and equality comparisons, enforcing RFC-compliant case-insensitive header matching and preventing header bypass attacks.

```swift
if let auth = req.headers[.authorization].first {
    // Validate token
}
res.headers.replaceOrAdd(name: .contentSecurityPolicy, value: "default-src 'self'")
```
