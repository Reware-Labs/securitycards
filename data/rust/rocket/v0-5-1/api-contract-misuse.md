# Security cards

Repository: `https://github.com/rwf2/Rocket#v0.5.1`
Category: api contract misuse

## api contract misuse

### Inspect Cookie Changes Using Pending State API

**Use when**

When developing route handlers in Rocket that mutate session or cookie state and need to inspect those modifications within the same request lifecycle.

**Secure rules**

**Rule 1: Use CookieJar::get_pending() instead of standard retrieval methods when querying uncommitted cookie mutations within the same request lifecycle.**

Standard cookie retrieval methods such as get() and get_private() only evaluate incoming request headers and cannot observe additions made during the current handler execution. Always invoke get_pending() to query modified or newly assigned session cookies correctly.

```rust
use rocket::http::{CookieJar, Cookie};

#[get("/session")]
fn update_session(jar: &CookieJar<'_>) {
    jar.add_private(("session", "new_token"));

    if let Some(cookie) = jar.get_pending("session") {
        assert_eq!(cookie.value(), "new_token");
    }
}
```
