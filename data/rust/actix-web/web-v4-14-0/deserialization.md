# Security cards

Repository: `https://github.com/actix/actix-web#web-v4.14.0`
Category: deserialization

## deserialization

### Validate response payload limits and format during JSON parsing

**Use when**

Deserializing structured response data from remote endpoints via `ClientResponse::json()` where content-type checks and payload limits prevent memory exhaustion or unexpected parsing.

**Secure rules**

**Rule 1: Rely on `ClientResponse::json()` to enforce an explicit `application/json` Content-Type check and default payload size limits instead of manually parsing raw bytes.**

When deserializing JSON responses using `ClientResponse::json()`, ensure that responses are handled via built-in parsing methods that enforce content type validation and strict payload length boundaries to prevent memory exhaustion and unexpected parsing behaviors.

```rust
#[derive(serde::Deserialize)]
struct MyResponse {
    id: u64,
}

let mut res = client.get("https://example.com/api")
    .send()
    .await?;

// json() enforces Content-Type matching and a 2 MiB payload limit by default
let data: MyResponse = res.json().await?;
```
