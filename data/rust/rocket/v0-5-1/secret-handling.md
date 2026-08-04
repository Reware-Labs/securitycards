# Security cards

Repository: `https://github.com/rwf2/Rocket#v0.5.1`
Category: secret handling

## secret handling

### Secure Secret Keys and Protect Private Cookie Data in Rocket

**Use when**

Configuring cryptographic secret keys, handling encrypted private cookies, and managing sensitive authentication tokens or credentials in Rocket applications.

**Secure rules**

**Rule 1: Configure a persistent, high-entropy 256-bit secret key in Rocket configuration for non-debug and release environments.**

Always configure an explicit `secret_key` in your Rocket configuration or environment variables when deploying applications or using private cookie methods like `add_private`, `get_private`, and `remove_private`. Avoid relying on auto-generated ephemeral keys in production environments to prevent session invalidation and ensure cryptographic integrity.

```toml
[default]
secret_key = "<your-base64-encoded-256-bit-key>"
```

**Rule 2: Use CookieJar::get_private to retrieve and decrypt confidential cookie data.**

When working with private cookies encrypted via `CookieJar::add_private()`, developers must explicitly call `CookieJar::get_private()` to retrieve and decrypt the value. Standard `CookieJar::get()` returns raw ciphertext rather than the decrypted plaintext.

```rust
use rocket::http::{Cookie, CookieJar};
use rocket::{get, post};

#[post("/login")]
fn login(jar: &CookieJar<'_>) {
    jar.add_private(Cookie::new("user_session", "secret_session_token"));
}

#[get("/dashboard")]
fn dashboard(jar: &CookieJar<'_>) -> String {
    match jar.get_private("user_session") {
        Some(cookie) => format!("Session active for: {}", cookie.value()),
        None => "Unauthorized access".into(),
    }
}
```

**Rule 3: Avoid placing sensitive data in flash messages**

Do not include secrets, authentication tokens, passwords, or sensitive personal data in Flash messages. Rocket v0.5.1 always stores the message and kind in the public, unencrypted, unsigned _flash cookie; enabling Rocket’s secrets feature does not make this cookie private.

```rust
use rocket::response::{Flash, Redirect};

#[post("/login")]
fn login() -> Flash<Redirect> {
    Flash::error(Redirect::to(uri!(index)), "Invalid username or password.")
}
```
