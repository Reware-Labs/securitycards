# Security cards

Repository: `https://github.com/salvo-rs/salvo#v0.94.0`
Category: csrf

## csrf

### Configure and Integrate Salvo CSRF Protection Middleware

**Use when**

Developing state-changing APIs and web routes in Salvo that require protection against cross-site request forgery using tokens, session stores, custom finders, and secure cookie configurations.

**Secure rules**

**Rule 1: Enable the csrf feature and register session handlers before CSRF middleware**

When protecting state-changing APIs using session stores, developers must enable the `csrf` feature flag and register the `SessionHandler` in the router before the `Csrf` middleware to ensure the request depot can successfully access session contexts.

```rust
use salvo::prelude::*;
use salvo::csrf::{Csrf, SessionStore, BcryptCipher};
use salvo_session::{SessionHandler, MemoryStore};

let session_handler = SessionHandler::builder()
    .store(MemoryStore::new())
    .build()
    .unwrap();

let csrf_handler = Csrf::new(
    BcryptCipher::new(*b"01234567890123456789012345678901"),
    SessionStore::new(),
);

let router = Router::new()
    .hoop(session_handler)
    .hoop(csrf_handler)
    .get(index);
```

**Rule 2: Configure secure cookie policies and rotation settings**

Explicitly enforce secure cookie attributes when hosting behind TLS-terminating proxies using `.secure(true)`, and select appropriate rotation policies such as `CsrfRotationPolicy::PerRequest` or `CsrfRotationPolicy::PerSession` based on your application security and usability needs.

```rust
use salvo_csrf::{Csrf, CsrfRotationPolicy, BcryptCipher, CookieStore, HeaderFinder};
use salvo_core::http::SecureCookiePolicy;

let csrf_store = CookieStore::new()
    .name("app.csrf_token")
    .secure(true);

let csrf = Csrf::new(
    BcryptCipher::new(),
    csrf_store,
    HeaderFinder::new("x-csrf-token")
)
.rotation_policy(CsrfRotationPolicy::PerRequest);
```

**Rule 3: Embed and retrieve CSRF tokens safely using hidden inputs and headers**

Retrieve the generated token from the depot using `depot.csrf_token()` to render it securely into form fields or use `HeaderFinder` to require custom headers like `X-CSRF-Token` for stronger cross-origin defense-in-depth.

```rust
#[handler]
pub async fn get_page(depot: &mut Depot, res: &mut Response) {
    let csrf_token = depot.csrf_token().unwrap_or_default();
    let html = format!("<input type=\"hidden\" name=\"csrf_token\" value=\"{}\" />", csrf_token);
    res.render(Text::Html(html));
}
```
