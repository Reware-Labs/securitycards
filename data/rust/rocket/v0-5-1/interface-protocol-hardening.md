# Security cards

Repository: `https://github.com/rwf2/Rocket#v0.5.1`
Category: interface protocol hardening

## interface protocol hardening

### Use Typed Responders and Dedicated Status Types for Protocol-Mandated Headers

**Use when**

When crafting HTTP responses in Rocket that require protocol-level headers or when registering protocol upgrade handlers.

**Secure rules**

**Rule 1: Use dedicated typed responders instead of bare tuples to ensure protocol headers are properly enforced.**

When returning responses that require specific protocol-level headers, such as authentication challenges or redirect targets, avoid returning bare tuples. Use dedicated types in `rocket::response::status` to guarantee that required HTTP headers accompany status codes.

```rust
use rocket::response::status;

#[get("/protected")]
fn protected() -> status::Unauthorized<&'static str> {
    status::Unauthorized(Some("Realm or auth prompt details"))
}
```

**Rule 2: Do not manually configure protocol upgrade status codes or headers.**

When registering protocol upgrade handlers using `Response::build().upgrade(...)`, rely on Rocket to automatically validate upgrade headers and assign status codes. Avoid manually setting `101 Switching Protocols` or injecting connection upgrade headers directly.

```rust
use std::pin::Pin;
use rocket::Response;
use rocket::http::Status;
use rocket::data::{IoHandler, IoStream};
use rocket::tokio::io;

struct EchoHandler;

#[rocket::async_trait]
impl IoHandler for EchoHandler {
    async fn io(self: Pin<Box<Self>>, io: IoStream) -> io::Result<()> {
        let (mut reader, mut writer) = io::split(io);
        io::copy(&mut reader, &mut writer).await?;
        Ok(())
    }
}

let response = Response::build()
    .status(Status::BadRequest)
    .upgrade("raw-echo", EchoHandler)
    .streamed_body(std::io::Cursor::new("Protocol upgrade failed or not requested."))
    .finalize();
```
