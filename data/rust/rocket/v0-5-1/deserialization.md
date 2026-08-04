# Security cards

Repository: `https://github.com/rwf2/Rocket#v0.5.1`
Category: deserialization

## deserialization

### Exclude server-managed structural fields and validate bounds during deserialization

**Use when**

Deserializing untrusted payloads into domain or model structures using Serde where primary keys or status codes are present.

**Secure rules**

**Rule 1: Ignore client-supplied primary keys during deserialization using Serde attributes.**

Annotate server-assigned structural fields like primary keys with `#[serde(skip_deserializing)]` on request body models to prevent clients from overriding identity fields or executing parameter tampering.

```rust
#[derive(Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
struct Post {
    #[serde(skip_deserializing, skip_serializing_if = "Option::is_none")]
    id: Option<i64>,
    title: String,
    text: String,
}
```

**Rule 2: Validate HTTP status code bounds during deserialization or manual instantiation.**

Rely on Serde's built-in range check when deserializing `Status` or validate raw integer codes using `Status::from_code()` to avoid violating HTTP standards and causing unexpected errors.

```rust
use rocket::http::Status;
use serde::Deserialize;

#[derive(Deserialize)]
struct StatusPayload {
    status: Status,
}

fn parse_raw_code(code: u16) -> Option<Status> {
    Status::from_code(code)
}
```
