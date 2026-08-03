# Security cards

Repository: `https://github.com/tokio-rs/axum#axum-v0.8.9`
Category: network boundary

## network boundary

### Restrict Network Interface Exposure When Binding Listeners

**Use when**

Binding network interfaces with `tokio::net::TcpListener` for `axum::serve` to control client access boundaries.

**Secure rules**

**Rule 1: Bind network listeners to loopback interfaces rather than wildcards when services should not be exposed externally.**

Explicitly choose the network address interface when binding `tokio::net::TcpListener` for `axum::serve`. Bind to `127.0.0.1` or `[::1]` for localhost-only access to prevent unintended external reachability.

```rust
let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await.unwrap();
axum::serve(listener, app).await;
```
