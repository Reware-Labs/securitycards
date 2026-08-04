# Security cards

Repository: `https://github.com/serde-rs/serde#v1.0.229`
Category: secret handling

## secret handling

### Prevent Sensitive Data Exposure Using Serde Skip Attributes

**Use when**

When serializing data structures containing sensitive information such as secret keys, passwords, or session tokens to prevent unauthorized exposure.

**Secure rules**

**Rule 1: Use #[serde(skip_serializing)] or #[serde(skip)] on fields containing sensitive information.**

Annotating sensitive struct fields with `#[serde(skip_serializing)]` prevents automatic serialization from emitting private fields in plaintext to output targets like log files or network responses.

```rust
use serde::Serialize;

#[derive(Serialize)]
struct UserAccount {
    pub username: String,
    #[serde(skip_serializing)]
    pub auth_token: String,
}
```
