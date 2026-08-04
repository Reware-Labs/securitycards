# Security cards

Repository: `https://github.com/actix/actix-web#web-v4.14.0`
Category: input contract definition

## input contract definition

### Enforce Strict Input Boundaries and Reject Unknown Multipart Fields

**Use when**

Handling structured form and multipart file uploads where unexpected fields or duplicate parameters must be rejected to prevent parameter pollution.

**Secure rules**

**Rule 1: Configure strict rejection attributes on multipart form structs to deny unknown fields and duplicate parameters.**

Use the `deny_unknown_fields` and `duplicate_field = "deny"` macro attributes on `MultipartForm` structs to strictly enforce input boundaries, rejecting parameter pollution and unintended field overrides.

```rust
#[derive(MultipartForm)]
#[multipart(deny_unknown_fields, duplicate_field = "deny")]
struct StrictProfileForm {
    pub username: Text<String>,
    pub email: Text<String>,
}
```
