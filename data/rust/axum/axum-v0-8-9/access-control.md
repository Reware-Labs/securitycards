# Security cards

Repository: `https://github.com/tokio-rs/axum#axum-v0.8.9`
Category: access control

## access control

### Enforce Route-Level Authorization and Access Control Early

**Use when**

When implementing access control, permission checks, or tenant isolation middleware and route layers in an Axum application.

**Secure rules**

**Rule 1: Short-circuit request execution immediately upon authorization failure in extractors or middleware.**

When writing custom middleware or extractors for access control, return an error response immediately when validation fails to prevent unauthorized requests from reaching downstream handlers.

```rust
async fn auth_middleware(
    headers: HeaderMap,
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    match headers.get("authorization") {
        Some(token) if token_is_valid(token) => Ok(next.run(request).await),
        _ => Err(StatusCode::UNAUTHORIZED),
    }
}
```
