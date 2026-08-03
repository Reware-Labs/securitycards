# Security cards

Repository: `https://github.com/tokio-rs/axum#axum-v0.8.9`
Category: csrf

## csrf

### Validate and destroy OAuth CSRF state parameters

**Use when**

Handling OAuth authorization callback requests where state parameters must be verified against server-stored CSRF tokens.

**Secure rules**

**Rule 1: Verify that the incoming state parameter matches the server-stored CSRF token and immediately destroy the session token after validation.**

Extract the CSRF token from the session using the request cookies, then immediately destroy the session to ensure single-use protection before comparing the stored secret against the incoming authorization request state.

```rust
async fn csrf_token_validation_workflow(
    auth_request: &AuthRequest,
    cookies: &headers::Cookie,
    store: &MemoryStore,
) -> Result<(), AppError> {
    let cookie = cookies.get(COOKIE_NAME).ok_or(anyhow!("Missing cookie"))?;
    let session = store.load_session(cookie.to_string()).await?.ok_or(anyhow!("Session not found"))?;
    let stored_csrf_token = session.get::<CsrfToken>(CSRF_TOKEN).ok_or(anyhow!("Missing token"))?;

    // Invalidate CSRF token session immediately after extraction
    store.destroy_session(session).await?;

    if *stored_csrf_token.secret() != auth_request.state {
        return Err(anyhow!("CSRF token mismatch").into());
    }
    Ok(())
}
```
