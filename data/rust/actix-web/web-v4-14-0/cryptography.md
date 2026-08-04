# Security cards

Repository: `https://github.com/actix/actix-web#web-v4.14.0`
Category: cryptography

## cryptography

### Restrict SHA1 hashing strictly to WebSocket handshake verification

**Use when**

When performing RFC 6455 WebSocket handshake challenge-response generation using `hash_key`.

**Secure rules**

**Rule 1: Use the `hash_key` function strictly for WebSocket handshake challenge-response protocol compliance.**

Calculate `base64(sha1(key + WS_GUID))` solely to perform the RFC 6455 WebSocket handshake challenge-response. Developers must not use `hash_key` or SHA-1 for general-purpose cryptographic security, data integrity verification, or credential hashing.

```rust
use actix_http::ws::hash_key;

// Correct: Calculating Sec-WebSocket-Accept response header per RFC 6455
let client_key = b"dGhlIHNhbXBsZSBub25jZQ==";
let accept_value = hash_key(client_key);
assert_eq!(accept_value.len(), 28);
```
