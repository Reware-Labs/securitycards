# Security cards

Repository: `https://github.com/salvo-rs/salvo#v0.94.0`
Category: secret handling

## secret handling

### Load Cryptographic Secret Keys and Session Secrets Securely at Runtime

**Use when**

When configuring authentication, session handlers, JWT decoders, or encrypted keys in Salvo applications.

**Secure rules**

**Rule 1: Use a cryptographically random session secret of at least 64 bytes**

Generate the secret passed to `SessionHandler` with a cryptographically secure random number generator. Salvo requires this secret to contain at least 64 bytes and uses it to derive the key that signs and verifies session cookies.

```rust
use rand::RngCore;
use salvo::session::{CookieStore, SessionHandler};

let mut secret = [0u8; 64];
rand::rngs::OsRng.fill_bytes(&mut secret);

let session_handler = SessionHandler::builder(
    CookieStore::new(),
    &secret,
)
.build()
.unwrap();
```
