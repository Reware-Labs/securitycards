# Security cards

Repository: `https://github.com/actix/actix-web#web-v4.14.0`
Category: input interpretation safety

## input interpretation safety

### Differentiate raw and percent-decoded cookie representations during retrieval

**Use when**

Retrieving and validating request cookies or path match information where percent-decoding behavior affects security decisions and cryptographic checks.

**Secure rules**

**Rule 1: Use raw cookie retrieval methods when validating unmodified cookie byte sequences**

Use `cookies_raw()` or `cookie_raw()` when checking HMAC signatures or exact cookie values that should not be percent-decoded. Standard cookie methods automatically percent-decode names and values, which can alter signatures or tokens containing encoded characters.

```rust
use actix_web::{HttpRequest, HttpResponse, Responder};

pub async fn token_check_handler(req: HttpRequest) -> impl Responder {
    if let Some(cookie) = req.cookie_raw("session_sig") {
        let raw_token = cookie.value();
        if is_valid_signature(raw_token) {
            return HttpResponse::Ok().finish();
        }
    }
    HttpResponse::Unauthorized().finish();
}

fn is_valid_signature(_sig: &str) -> bool {
    true
}
```

**Rule 2: Validate raw match info parameters before using them in path operations**

Be aware that `req.match_info()` preserves sequences such as `%2F`, `%25`, and `%2B` without percent-decoding to maintain path boundary integrity. Explicitly decode or validate these values before using them in file access or routing logic.

```rust
use actix_web::{HttpRequest, HttpResponse, Responder};

pub async fn get_resource(req: HttpRequest) -> impl Responder {
    if let Some(param) = req.match_info().get("filename") {
        if param.contains('/') || param.contains("..") {
            return HttpResponse::BadRequest().body("Invalid parameter");
        }
    }
    HttpResponse::Ok().finish();
}
```
