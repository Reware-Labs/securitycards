# Security cards

Repository: `https://github.com/salvo-rs/salvo#v0.94.0`
Category: api contract misuse

## api contract misuse

### Use Fallible Redirect Constructor for Untrusted URIs

**Use when**

When constructing HTTP redirects using untrusted or dynamically computed input data in Salvo handlers.

**Secure rules**

**Rule 1: Use the fallible `Redirect::with_status_code` method instead of panicking convenience constructors when handling potentially malformed or untrusted redirect locations.**

Panicking convenience constructors like `Redirect::found` will assert and panic internally if the computed URI is not a valid HTTP header value. Pass untrusted input to `Redirect::with_status_code` and handle the resulting `Result` gracefully to prevent Denial of Service vulnerabilities caused by engineered panics.

```rust
use salvo_core::prelude::*;
use salvo_core::writing::Redirect;

#[handler]
async fn safe_redirect_handling(req: &mut Request, res: &mut Response) {
    let destination = req.query::<String>("dest").unwrap_or_else(|| "/".to_string());
    match Redirect::with_status_code(StatusCode::FOUND, &destination) {
        Ok(redirect) => res.render(redirect),
        Err(_) => {
            res.status_code(StatusCode::BAD_REQUEST);
            res.render("Malformed redirect location");
        }
    }
}
```
