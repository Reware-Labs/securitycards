# Security cards

Repository: `https://github.com/actix/actix-web#web-v4.14.0`
Category: session management

## session management

### Invalidate Client-Side Sessions Safely with add_removal_cookie

**Use when**

Clearing session cookies or authentication state from the client browser during logout or session termination

**Secure rules**

**Rule 1: Use add_removal_cookie instead of del_cookie to properly invalidate stored cookies on the client browser.**

When logging a user out or clearing session tokens, calling `del_cookie` only removes `Set-Cookie` headers from the in-memory response struct without instructing the browser to clear stored cookies. To ensure the client browser deletes the session cookie, construct a cookie with matching path and domain attributes and invoke `add_removal_cookie`.

```rust
use actix_web::HttpResponse;
use cookie::Cookie;

let mut res = HttpResponse::Ok().finish();
let cookie = Cookie::build("session_id", "")
    .path("/")
    .finish();
res.add_removal_cookie(&cookie).expect("valid header value");
```
