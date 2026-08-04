# Security cards

Repository: `https://github.com/serde-rs/serde#v1.0.229`
Category: resource exhaustion

## resource exhaustion

### Skip Unneeded Payload Fields Efficiently Using IgnoredAny

**Use when**

Deserializing untrusted inputs where certain payload fields are irrelevant or unused.

**Secure rules**

**Rule 1: Use `serde::de::IgnoredAny` to skip unused input elements and mitigate memory exhaustion risks.**

When deserializing untrusted inputs containing irrelevant payload fields, avoid parsing into temporary dynamically allocated structures like generic maps or strings. Instead, use `serde::de::IgnoredAny` via attributes such as `#[serde(default)]` to efficiently skip unused input elements without allocating heap memory, mitigating memory exhaustion risks from unexpectedly large, unused payload fields.

```rust
use serde::de::IgnoredAny;
use serde::Deserialize;

#[derive(Deserialize)]
struct Payload {
    id: u64,
    #[serde(default)]
    _ignored: IgnoredAny,
}
```
