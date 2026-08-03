# Security cards

Repository: `https://github.com/serde-rs/serde#v1.0.229`
Category: input interpretation safety

## input interpretation safety

### Enforce UTF-8 validation during custom string deserialization

**Use when**

Deserializing raw byte sequences into string types using custom visitor implementations

**Secure rules**

**Rule 1: Perform explicit UTF-8 validation when handling raw bytes in custom visitors**

When implementing custom visitor methods such as `visit_bytes` or `visit_byte_buf`, ensure that raw byte sequences are explicitly validated as UTF-8 using `std::str::from_utf8` before constructing `String` instances to prevent invalid representations.

```rust
use serde::de::{self, Visitor, Error};
use std::fmt;

struct ValidatedStringVisitor;

impl<'de> Visitor<'de> for ValidatedStringVisitor {
    type Value = String;

    fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
        formatter.write_str("a valid UTF-8 byte sequence")
    }

    fn visit_bytes<E>(self, v: &[u8]) -> Result<Self::Value, E>
    where
        E: Error,
    {
        std::str::from_utf8(v)
            .map(|s| s.to_owned())
            .map_err(|_| Error::invalid_value(de::Unexpected::Bytes(v), &self))
    }
}
```
