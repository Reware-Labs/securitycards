# Security cards

Repository: `https://github.com/salvo-rs/salvo#v0.94.0`
Category: session management

## session management

### Force Secure Cookie Attributes for Sessions Behind Upstream TLS Termination

**Use when**

Configuring session handling in Salvo applications deployed behind an upstream proxy or load balancer that terminates TLS.

**Secure rules**

**Rule 1: Explicitly force the secure attribute on session cookies when TLS is terminated upstream.**

By default, `SessionHandler` automatically detects whether to append the `Secure` flag based on the request URI scheme. When deployed behind an upstream proxy that terminates TLS, the local request may appear as unencrypted HTTP, causing Salvo to omit the `Secure` attribute. To prevent session cookies from being transmitted over unencrypted HTTP channels, explicitly configure the session handler builder with `secure_cookie(true)`.

```rust
use salvo::session::SessionHandler;
use saysion::MemoryStore;

let store = MemoryStore::new();
let secret = [0u8; 64];

let handler = SessionHandler::builder(store, &secret)
    .secure_cookie(true)
    .build()
    .unwrap();
```
