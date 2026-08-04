# Security cards

Repository: `https://github.com/salvo-rs/salvo#v0.94.0`
Category: cryptography

## cryptography

### Hash Passwords Securely Using Argon2id

**Use when**

When storing or verifying user credentials and passwords in Salvo database examples or applications.

**Secure rules**

**Rule 1: Hash user credentials using memory-hard password hashing algorithms such as Argon2id prior to database storage.**

Always hash passwords before database storage and use robust hashing libraries like `argon2` to protect against offline brute-force attacks.

```rust
use argon2::{password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString}, Argon2};

pub fn hash_password(password: &str) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2.hash_password(password.as_bytes(), &salt)?.to_string();
    Ok(password_hash)
}
```


### Use Cryptographically Secure Keys and Random Generators for Ciphers and Cookies

**Use when**

When initializing ciphers, session stores, or flash cookies requiring cryptographic keys or secure entropy.

**Secure rules**

**Rule 1: Load cryptographic keys from safe environment stores instead of using hardcoded or predictable sequences of bytes.**

Feed key-based ciphers like `HmacCipher`, `AesGcmCipher`, or `CcpCipher` with high-entropy cryptographically secure random keys loaded from safe environment variables to prevent token forgery.

```rust
use salvo_csrf::hmac_cookie_csrf;
use salvo_csrf::HeaderFinder;

let key_string = std::env::var("CSRF_SECRET_KEY").expect("CSRF_SECRET_KEY must be set");
let mut key = [0u8; 32];
let decoded = hex::decode(key_string).expect("Failed to decode key hex");
key.copy_from_slice(&decoded[..32]);

let csrf_middleware = hmac_cookie_csrf(key, HeaderFinder::new("x-csrf-token"));
```

**Rule 2: Assign a stable cryptographic key to flash cookies and session stores.**

Initialize stores like `CookieStore` with a stable, high-entropy secret loaded from environment variables rather than relying on random defaults that invalidate sessions on restart.

```rust
use salvo_core::http::cookie::Key;
use salvo_flash::CookieStore;

let secret_key_bytes = std::env::var("SESSION_SECRET_KEY")
    .expect("SESSION_SECRET_KEY must be set");
let key = Key::from(secret_key_bytes.as_bytes());

let store = CookieStore::new().key(key);
```
