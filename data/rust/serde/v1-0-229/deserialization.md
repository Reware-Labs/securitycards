# Security cards

Repository: `https://github.com/serde-rs/serde#v1.0.229`
Category: deserialization

## deserialization

### Enforce strict schema validation and allowlisting during deserialization

**Use when**

When deserializing untrusted input into custom structures, enums, or derived types to prevent type confusion, unauthorized object construction, and gadget execution.

**Secure rules**

**Rule 1: Apply schema validation before object construction using explicit type and field allowlists.**

When deserializing adjacently tagged enums, explicitly specify `#[serde(deny_unknown_fields)]` on the enum declaration to prevent loose schema parsing and reject inputs containing extra fields beyond the designated tag and content keys.

```rust
use serde::Deserialize;

#[derive(Debug, PartialEq, Deserialize)]
#[serde(tag = "t", content = "c", deny_unknown_fields)]
enum SecureAdjacentlyTagged {
    Unit,
    Data(u32),
}
```
