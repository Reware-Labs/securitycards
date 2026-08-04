# Security cards

Repository: `https://github.com/rwf2/Rocket#v0.5.1`
Category: session management

## session management

### Secure and manage session states using Rocket CookieJar mechanisms

**Use when**

Developing authentication, session management, or stateful cookie handling features using Rocket's `CookieJar`.

**Secure rules**

**Rule 1: Use private encrypted cookies for storing sensitive session identifiers and user state.**

When storing session identifiers or authenticated user state in HTTP cookies using Rocket's `CookieJar`, use private cookies via `add_private`, `get_private`, and `remove_private`. Private cookies provide authenticated encryption, protecting sensitive session tokens from client-side tampering, forgery, or eavesdropping.

```rust
#[post("/login", data = "<login>")]
fn post_login(jar: &CookieJar<'_>, login: Form<Login<'_>>) -> Result<Redirect, Flash<Redirect>> {
    if login.username == "Sergio" && login.password == "password" {
        jar.add_private(("user_id", "1"));
        Ok(Redirect::to(uri!(index)))
    } else {
        Err(Flash::error(Redirect::to(uri!(login_page)), "Invalid credentials."))
    }
}

#[post("/logout")]
fn logout(jar: &CookieJar<'_>) -> Flash<Redirect> {
    jar.remove_private("user_id");
    Flash::success(Redirect::to(uri!(login_page)), "Successfully logged out.")
}
```

**Rule 2: Explicitly match path and domain attributes when invalidating or removing session cookies.**

When invalidating session cookies using `jar.remove()` or `jar.remove_private()`, explicitly match the `path` and `domain` attributes with which the original cookie was set. Browsers strictly reject cookie removal headers if the `path` or `domain` attributes do not exactly match the original cookie.

```rust
use rocket::http::{Cookie, CookieJar};

#[post("/logout")]
fn logout(jar: &CookieJar<'_>) {
    jar.remove_private(Cookie::build("session").path("/app"));
}
```

**Rule 3: Explicitly configure transient expiration for private session cookies.**

When issuing encrypted or authenticated session state using `CookieJar::add_private()`, ensure expiration behavior is intentionally set. Explicitly setting `.expires(None)` on the `CookieBuilder` creates a transient session cookie that is cleared when the user agent closes, ensuring sensitive session identifiers do not persist unnecessarily on client disk storage.

```rust
use rocket::http::{CookieJar, Cookie};

#[rocket::get("/session")]
fn create_session(jar: &CookieJar<'_>) {
    jar.add_private(Cookie::build(("session_id", "encrypted_session_val")).expires(None));
}
```

**Rule 4: Manage session cookies inside error catchers to clear stale session tokens.**

When handling security-relevant failure states such as authentication or authorization errors, developers should explicitly manipulate cookies directly through `request.cookies()` to invalidate expired session tokens or convey state safely, accounting for automatic cookie delta resets during error dispatch.

```rust
#[catch(401)]
fn unauthorized(request: &rocket::Request) -> &'static str {
    request.cookies().remove("session_id");
    "401 Unauthorized"
}
```
