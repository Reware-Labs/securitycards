# Security cards

Repository: `https://github.com/tokio-rs/axum#axum-v0.8.9`
Category: session management

## session management

### Set secure cookie flags and return updated CookieJar instances in Axum handlers

**Use when**

Managing session identifiers or authentication cookies via response headers and cookie jars in Axum handlers.

**Secure rules**

**Rule 1: Explicitly format session cookies with restrictive security directives and return updated cookie jars from handlers.**

When returning session tokens or session identifier cookies, explicitly configure restrictive security directives including `SameSite=Lax`, `HttpOnly`, and `Secure`. Always return updated `CookieJar` or `PrivateCookieJar` instances from response handlers when adding, updating, or removing cookies to ensure that `Set-Cookie` headers are properly emitted.

```rust
use axum::response::Redirect;
use axum_extra::extract::cookie::{CookieJar, Cookie};

async fn login_handler(jar: CookieJar) -> (CookieJar, Redirect) {
    let updated_jar = jar.add(Cookie::new("session_id", "token_123"));
    (updated_jar, Redirect::to("/dashboard"))
}
```
