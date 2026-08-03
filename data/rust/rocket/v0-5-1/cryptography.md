# Security cards

Repository: `https://github.com/rwf2/Rocket#v0.5.1`
Category: cryptography

## cryptography

### Initialize Secret Keys with Sufficient Cryptographic Entropy

**Use when**

Instantiating or configuring secret keys manually in the application configuration using Rocket's secret key management.

**Secure rules**

**Rule 1: Provide sufficiently long cryptographically secure random byte slices when manually instantiating `SecretKey`.**

When manually instantiating `SecretKey` using `SecretKey::from` or `SecretKey::derive_from`, ensure the source byte slices meet minimum length requirements such as 64 bytes for a master key and originate from a cryptographically secure random source to prevent application panic and ensure strong cryptographic protection.

```rust
use rocket::config::SecretKey;

let mut master = [0u8; 64];
let key = SecretKey::from(&master);
```
