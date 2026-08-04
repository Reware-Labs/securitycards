# Security cards

Repository: `https://github.com/tokio-rs/axum#axum-v0.8.9`
Category: security control integrity

## security control integrity

### Apply Security Middleware After Defining Target Routes in Axum

**Use when**

Registering security-critical middleware layers such as authentication, authorization, or rate limiting on an Axum Router.

**Secure rules**

**Rule 1: Ensure all target routes are defined on the Router before applying `.layer()` to prevent security bypasses.**

In Axum, `Router::layer` applies middleware only to existing routes attached prior to the `.layer()` call. Any routes added afterwards will completely bypass the security controls. Always define your routes first and then apply the middleware layer.

```rust
use axum::{routing::get, Router};
use tower_http::trace::TraceLayer;

let app = Router::new()
    .route("/foo", get(|| async {}))
    .route("/bar", get(|| async {}))
    .layer(TraceLayer::new_for_http());
```
