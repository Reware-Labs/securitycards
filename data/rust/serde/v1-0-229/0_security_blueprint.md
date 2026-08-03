# Security blueprint

Repository: `https://github.com/serde-rs/serde#v1.0.229`

## Security posture

When developing and maintaining serialization and deserialization components in this repository, developers must assume that all external payloads are untrusted and potentially malicious. The library protects against memory exhaustion and schema violations only when explicit safety attributes, allowlists, and strict parsing rules are enforced. Security-sensitive surfaces include custom visitor implementations, parsing boundaries for recursive or large structures, and types handling sensitive information or interior mutability. All schema violations, unrecognized properties, and invalid representations must fail closed by returning explicit serialization or deserialization errors.

## Essential implementation rules

1. **Validate Data Invariants Prior to Serialization**

When implementing custom `Serialize` logic for types with constraints such as valid UTF-8 strings or interior mutability types like `RefCell`, validate data invariants prior to serialization and return errors via `ser::Error::custom` if validation fails to avoid producing malformed output.

2. **Enforce Strict Schema Validation and Deny Unknown Fields**

By default, Serde silently ignores unrecognized fields during deserialization. Annotate structs and enums with `#[serde(deny_unknown_fields)]` when strict payload validation is required to prevent parameter injection, type confusion, and inconsistent validation logic, especially for adjacently tagged enums.

3. **Perform Explicit UTF-8 Validation in Custom Visitors**

When implementing custom visitor methods such as `visit_bytes` or `visit_byte_buf`, ensure that raw byte sequences are explicitly validated as UTF-8 using `std::str::from_utf8` before constructing `String` instances to prevent invalid representations and incorrect input interpretation.

4. **Skip Unneeded Payload Fields Efficiently Using IgnoredAny**

When deserializing untrusted inputs containing irrelevant payload fields, avoid parsing into temporary dynamically allocated structures like generic maps or strings. Instead, use `serde::de::IgnoredAny` via attributes such as `#[serde(default)]` to efficiently skip unused input elements without allocating heap memory, mitigating memory exhaustion risks.

5. **Prevent Sensitive Data Exposure Using Serde Skip Attributes**

Annotating sensitive struct fields containing information such as secret keys, passwords, or session tokens with `#[serde(skip_serializing)]` prevents automatic serialization from emitting private fields in plaintext to output targets like log files or network responses.
