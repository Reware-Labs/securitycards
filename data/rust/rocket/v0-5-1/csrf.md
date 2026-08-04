# Security cards

Repository: `https://github.com/rwf2/Rocket#v0.5.1`
Category: csrf

## csrf

### Enforce SameSite Cookie Policies and Protect Method-Overridden Endpoints Against CSRF

**Use when**

Configuring session cookies and handling state-changing requests or method-overridden endpoints in Rocket.

**Secure rules**

**Rule 1: Maintain SameSite::Strict cookie attributes or explicitly configure strict or lax policies to prevent CSRF attacks.**

Rocket automatically defaults the `SameSite` attribute on cookies added via `CookieJar::add` and `CookieJar::add_private` to `SameSite::Strict`. When configuring custom cookies or modifying cookie properties, maintain `SameSite::Strict` or `SameSite::Lax` and avoid configuring `SameSite::None` unless cross-site request handling is required and backed by anti-CSRF tokens.

```rust
use rocket::http::{Cookie, SameSite, CookieJar};

#[get("/")]
fn handler(jar: &CookieJar<'_>) {
    // Automatically receives SameSite::Strict by default
    jar.add(("session_id", "secret_value"));

    // Explicitly set SameSite::Strict on custom cookies
    let cookie = Cookie::build(("session_id", "secret_value"))
        .same_site(SameSite::Strict)
        .path("/");
    jar.add(cookie);
}
```

**Rule 2: Apply explicit anti-CSRF protection to non-POST routes that handle method overrides**

During request preprocessing, Rocket v0.5.1 rewrites a POST only when its content type is application/x-www-form-urlencoded and its first form field, within the 32-byte body peek, is _method with a valid HTTP method value such as PUT, PATCH, or DELETE. Because standard browser HTML forms can easily issue cross-origin POST requests with a `_method` field, state-changing routes such as #[put], #[patch], and #[delete] remain vulnerable to Cross-Site Request Forgery and must enforce the same anti-CSRF token or origin validation as state-changing POST routes; SameSite=Strict authentication cookies are defense in depth, not a universal substitute.
