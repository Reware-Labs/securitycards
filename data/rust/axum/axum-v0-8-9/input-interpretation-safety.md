# Security cards

Repository: `https://github.com/tokio-rs/axum#axum-v0.8.9`
Category: input interpretation safety

## input interpretation safety

### Validate percent-decoded URL path parameters to prevent path traversal

**Use when**

Extracting URL path parameters from incoming requests where percent-decoding could transform traversal sequences.

**Secure rules**

**Rule 1: Parse path parameters into strongly typed identifiers rather than raw strings to prevent alternate interpretations and traversal attacks.**

Axum automatically percent-decodes URL path parameters and rejects non-UTF-8 content, but decoding can expose traversal sequences like `../`. Developers must prefer deserializing path parameters directly into strongly typed identifiers such as `Uuid` or integers instead of raw `String` parameters.

```rust
use axum::extract::Path;
use uuid::Uuid;

async fn get_user_avatar(Path(user_id): Path<Uuid>) {
    // user_id is guaranteed to be a valid Uuid, preventing path traversal
}
```
