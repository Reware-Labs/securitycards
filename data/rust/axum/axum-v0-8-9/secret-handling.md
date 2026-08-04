# Security cards

Repository: `https://github.com/tokio-rs/axum#axum-v0.8.9`
Category: secret handling

## secret handling

### Load authentication and cryptographic secrets from runtime environment variables

**Use when**

Configuring application state, middleware layers, or cryptographic keys that require sensitive credentials and secrets.

**Secure rules**

**Rule 1: Load cryptographic keys and authentication tokens dynamically from runtime environment variables rather than embedding them in source code.**

Always read secrets from environment variables or trusted secret providers at startup. Use `std::env::var` to retrieve values like `JWT_SECRET`, `COOKIE_SECRET_KEY`, or `ADMIN_BEARER_TOKEN` and fail startup if the configuration is missing.

```rust
let admin_token = std::env::var("ADMIN_BEARER_TOKEN")
    .expect("ADMIN_BEARER_TOKEN environment variable must be set");

let admin_router = Router::new()
    .route("/keys", delete(delete_all_keys))
    .layer(ValidateRequestHeaderLayer::bearer(&admin_token));
```
