# Security cards

Repository: `https://github.com/serde-rs/serde#v1.0.229`

## Category: api contract misuse

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


## Category: deserialization

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


## Category: input contract definition

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


## Category: input interpretation safety

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


## Category: resource exhaustion

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


## Category: secret handling

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
