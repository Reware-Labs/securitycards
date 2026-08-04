# Security cards

Repository: `https://github.com/serde-rs/serde#v1.0.229`
Category: input contract definition

## input contract definition

### Enforce strict schema validation and reject unknown fields

**Use when**

Deserializing untrusted payloads into structs or enums where unexpected or unrecognized properties should be rejected.

**Secure rules**

**Rule 1: Apply `#[serde(deny_unknown_fields)]` to data structures handling untrusted input to enforce strict schema adherence and reject unexpected payload properties.**

By default, Serde silently ignores unrecognized fields during deserialization. Annotate structs and enums with `#[serde(deny_unknown_fields)]` when strict payload validation is required to prevent parameter injection and inconsistent validation logic.

```rust
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CreateUserPayload {
    pub username: String,
    pub email: String,
}
```
