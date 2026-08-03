# Security cards

Repository: `https://github.com/tokio-rs/axum#axum-v0.8.9`
Category: resource exhaustion

## resource exhaustion

### Enforce Request Body and Concurrency Limits to Prevent Resource Exhaustion

**Use when**

Building or configuring Axum HTTP routes and services that handle incoming request bodies, file uploads, or concurrent workloads.

**Secure rules**

**Rule 1: Enforce explicit request body size limits on all routes and file uploads to prevent memory exhaustion from oversized payloads.**

Rely on Axum's default body limits or use `DefaultBodyLimit::max` or `RequestBodyLimitLayer` to restrict payload sizes before processing requests or buffering streams in memory or middleware.

```rust
use axum::extract::DefaultBodyLimit;
use axum::Router;

let app = Router::new()
    .layer(DefaultBodyLimit::max(1024 * 1024));
```

**Rule 2: Apply global concurrency limits and timeouts to protect the application against denial-of-service attacks.**

Combine request body limit configurations with timeout and concurrency layers using `ServiceBuilder` to limit concurrent connections and prevent thread pool and connection exhaustion.

```rust
let app = Router::new()
    .layer(
        ServiceBuilder::new()
            .layer(HandleErrorLayer::new(handle_error))
            .load_shed()
            .concurrency_limit(1024)
            .timeout(Duration::from_secs(10))
    );
```
