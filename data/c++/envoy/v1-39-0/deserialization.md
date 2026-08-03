# Security cards

Repository: `https://github.com/envoyproxy/envoy#v1.39.0`
Category: deserialization

## deserialization

### Enforce strict Protobuf message validation during deserialization

**Use when**

When processing dynamic xDS configurations or local protobuf structures to prevent accepting unvalidated or smuggled fields.

**Secure rules**

**Rule 1: Execute strict downcasting and validation with recursion enabled when processing untrusted protobuf structures.**

Use `TestUtility::validate` with `recurse_into_any` set to true to enforce strict message integrity. Ensure exceptions such as `ProtoValidationException` and `EnvoyException` are caught and handled to prevent structural failures and rule validation bypasses.

```cpp
try {
  TestUtility::validate(bootstrap_config, /*recurse_into_any=*/true);
} catch (const ProtoValidationException& e) {
  // Handle rule validation failure
} catch (const EnvoyException& e) {
  // Handle unknown fields or structural failure
}
```
