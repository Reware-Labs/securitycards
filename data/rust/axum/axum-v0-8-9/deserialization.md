# Security cards

Repository: `https://github.com/tokio-rs/axum#axum-v0.8.9`
Category: deserialization

## deserialization

### Use Cow with Serde borrow attribute for safe zero-copy JSON deserialization

**Use when**

When implementing zero-copy request parsing in Axum using `JsonDeserializer` where fields might contain escape sequences.

**Secure rules**

**Rule 1: Use `std::borrow::Cow` decorated with `#[serde(borrow)]` for fields that may contain escape sequences during deserialization.**

When parsing request payloads with `JsonDeserializer`, raw `&'a str` or `&'a [u8]` fields will fail if they encounter escape sequences like `\"` or `\n`. Developers must use `std::borrow::Cow<'a, str>` or `std::borrow::Cow<'a, [u8]>` with `#[serde(borrow)]` to enable zero-copy borrowing while safely falling back to owned allocations when escape sequences are encountered.

```rust
use axum_extra::extract::JsonDeserializer;
use axum::response::{IntoResponse, Response};
use serde::Deserialize;
use std::borrow::Cow;
use http::StatusCode;

#[derive(Deserialize)]
struct SafePayload<'a> {
    #[serde(borrow)]
    username: Cow<'a, str>,
}

async fn handle_upload(deserializer: JsonDeserializer<SafePayload<'_>>) -> Response {
    let payload = match deserializer.deserialize() {
        Ok(data) => data,
        Err(rejection) => return rejection.into_response(),
    };

    StatusCode::OK.into_response()
}
```
