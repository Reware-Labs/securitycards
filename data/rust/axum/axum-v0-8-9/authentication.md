# Security cards

Repository: `https://github.com/tokio-rs/axum#axum-v0.8.9`
Category: authentication

## authentication

### Implement custom token extractors using FromRequestParts for request authentication

**Use when**

When building Axum request extractors or middleware that must verify incoming bearer tokens or credentials before allowing route handlers to execute.

**Secure rules**

**Rule 1: Validate token signatures, claims, and extraction errors within Axum extractors or authentication middleware.**

Implement `FromRequestParts` on custom types to extract and verify bearer tokens using validation libraries, mapping failures to unauthorized responses. Alternatively, perform credential validation inside middleware and insert validated user identities into request extensions before proceeding.

```rust
impl<S> FromRequestParts<S> for Claims
where
    S: Send + Sync,
{
    type Rejection = AuthError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let TypedHeader(Authorization(bearer)) = parts
            .extract::<TypedHeader<Authorization<Bearer>>>()
            .await
            .map_err(|_| AuthError::InvalidToken)?;

        let token_data = decode::<Claims>(bearer.token(), &KEYS.decoding, &Validation::default())
            .map_err(|_| AuthError::InvalidToken)?;

        Ok(token_data.claims)
    }
}
```
