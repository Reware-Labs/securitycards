# Security cards

Repository: `https://github.com/tokio-rs/axum#axum-v0.8.9`
Category: interface protocol hardening

## interface protocol hardening

### Configure Security and CORS Headers on Axum Responses

**Use when**

Configuring security headers and cross-origin resource sharing policies for HTTP responses in an axum web application.

**Secure rules**

**Rule 1: Restrict cross-origin resource sharing origins, methods, and headers explicitly using `CorsLayer`.**

When configuring Cross-Origin Resource Sharing HTTP headers using `tower_http::cors::CorsLayer` on an axum `Router`, explicitly restrict allowed origins, HTTP methods, and allowed request headers to strictly required endpoints and origins, avoiding wildcards.

```rust
use axum::{http::{HeaderValue, Method, header::CONTENT_TYPE}, routing::get, Router};
use tower_http::cors::CorsLayer;

let app = Router::new()
    .route("/json", get(json_handler))
    .layer(
        CorsLayer::new()
            .allow_origin("http://localhost:3000".parse::<HeaderValue>().unwrap())
            .allow_methods([Method::GET, Method::POST])
            .allow_headers([CONTENT_TYPE])
    );
```

**Rule 2: Attach systematic security response headers using response mapping middleware.**

Use `map_response` middleware to append security response headers across routes, ensuring headers like `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, and `Strict-Transport-Security` are systematically set on outgoing responses.

```rust
use axum::{
    Router,
    routing::get,
    middleware::map_response,
    response::Response,
    http::HeaderValue,
};

async fn set_security_headers<B>(mut response: Response<B>) -> Response<B> {
    let headers = response.headers_mut();
    headers.insert("x-content-type-options", HeaderValue::from_static("nosniff"));
    headers.insert("x-frame-options", HeaderValue::from_static("DENY"));
    headers.insert("content-security-policy", HeaderValue::from_static("default-src 'self'"));
    response
}

let app = Router::new()
    .route("/", get(|| async { "Hello, World!" }))
    .layer(map_response(set_security_headers));
```


### Sanitize redirect location strings to prevent header parsing failures

**Use when**

When constructing HTTP redirection responses from user-supplied paths or parameters in Axum handlers.

**Secure rules**

**Rule 1: Validate redirect paths against header-safe character sets to prevent response construction failures and server errors.**

When using `Redirect` to convert location strings into HTTP header values, ensure inputs do not contain invalid control characters like newlines or carriage returns. Unchecked input containing these characters causes axum to encounter conversion failures and return a `500 Internal Server Error` response instead of setting the header correctly.

```rust
use axum::response::Redirect;

pub fn sanitize_and_redirect(path: &str) -> Result<Redirect, &'static str> {
    if path.contains('\n') || path.contains('\r') {
        return Err("Invalid redirect character");
    }
    Ok(Redirect::to(path))
}
```
