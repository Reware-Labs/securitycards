# Security cards

Repository: `https://github.com/tokio-rs/axum#axum-v0.8.9`
Category: input contract definition

## input contract definition

### Enforce Domain Constraints Using Validation Extractors

**Use when**

When building request handlers in axum that receive data and require field length, numerical bounds, or string pattern safety beyond standard type deserialization.

**Secure rules**

**Rule 1: Implement custom wrapper extractors using `FromRequest` to invoke domain validation before processing request data in handlers.**

Standard request extractors like `Form<T>` only handle type deserialization and do not enforce constraints like length, numerical bounds, or string patterns. Implement a custom wrapper extractor that executes validation libraries such as `validator::Validate` during `from_request` to reject malformed data before application processing.

```rust
impl<T, S> FromRequest<S> for ValidatedForm<T>
where
    T: DeserializeOwned + Validate,
    S: Send + Sync,
    Form<T>: FromRequest<S, Rejection = FormRejection>,
{
    type Rejection = ServerError;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        let Form(value) = Form::<T>::from_request(req, state).await?;
        value.validate()?;
        Ok(ValidatedForm(value))
    }
}
```
