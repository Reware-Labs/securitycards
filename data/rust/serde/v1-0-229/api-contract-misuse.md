# Security cards

Repository: `https://github.com/serde-rs/serde#v1.0.229`
Category: api contract misuse

## api contract misuse

### Drop mutable borrow guards prior to serializing interior mutability types

**Use when**

serializing data structures that utilize interior mutability types like `RefCell` where active mutable borrow guards could cause runtime serialization errors.

**Secure rules**

**Rule 1: Validate data invariants prior to serialization and return errors via `ser::Error::custom` if validation fails.**

When implementing custom `Serialize` logic for types with constraints such as valid UTF-8 strings, validate data invariants prior to serialization and return errors via `ser::Error::custom` if validation fails to avoid producing malformed output.

```rust
use serde::ser::{self, Serialize, Serializer};

struct CustomPath(std::path::PathBuf);

impl Serialize for CustomPath {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        match self.0.to_str() {
            Some(s) => serializer.serialize_str(s),
            None => Err(ser::Error::custom("path contains invalid UTF-8 characters")),
        }
    }
}
```
