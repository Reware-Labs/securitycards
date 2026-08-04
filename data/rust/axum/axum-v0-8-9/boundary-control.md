# Security cards

Repository: `https://github.com/tokio-rs/axum#axum-v0.8.9`
Category: boundary control

## boundary control

### Apply Request-Modifying Middleware at the Router Service Boundary

**Use when**

Applying middleware that modifies request URIs or properties affecting routing decisions before requests are handled by Axum.

**Secure rules**

**Rule 1: Wrap the complete Router service with request-modifying middleware instead of using Router::layer.**

When modifying request URIs or state before routing takes place, register your middleware by wrapping the entire `Router` service. Using `Router::layer` executes middleware after Axum has already performed HTTP route matching, which can cause unexpected route execution or bypass security boundaries.

```rust
use tower::Layer;
use axum::{Router, ServiceExt, extract::Request};

fn rewrite_request_uri(req: Request) -> Request {
    req
}

let middleware = tower::util::MapRequestLayer::new(rewrite_request_uri);
let app = Router::new().route("/api", get(handler));

let app_with_middleware = middleware.layer(app);
```
