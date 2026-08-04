# Security cards

Repository: `https://github.com/salvo-rs/salvo#v0.94.0`
Category: authentication

## authentication

### Configure Explicit Claims Validation and Token Decoders in Salvo

**Use when**

Setting up JWT authentication or token decoders in Salvo applications to authenticate clients and verify credentials.

**Secure rules**

**Rule 1: Explicitly configure audience and issuer validation when instantiating JWT decoders.**

When instantiating `ConstDecoder`, use `ConstDecoder::with_validation` with a configured `Validation` object to enforce checks on expected claims like `aud` and `iss` to prevent token replay and privilege escalation across applications.

```rust
use salvo::jwt_auth::{Algorithm, ConstDecoder, DecodingKey, Validation};

let mut validation = Validation::new(Algorithm::HS256);
validation.set_audience(&["api://salvo-service"]);
validation.required_spec_claims.insert("aud".to_owned());

let decoder = ConstDecoder::with_validation(
    DecodingKey::from_secret(SECRET),
    validation,
);
```

**Rule 2: Restrict token extraction mechanisms in production environments.**

Avoid extracting JWTs from URL query parameters using `QueryFinder` in production to prevent token exposure in logs, browser history, and referer headers. Use `HeaderFinder` or secure cookies instead.

```rust
use salvo::jwt_auth::{JwtAuth, ConstDecoder, HeaderFinder};

let auth_handler: JwtAuth<JwtClaims, _> = JwtAuth::new(
    ConstDecoder::from_secret(b"your_secure_secret_key")
)
.finders(vec![Box::new(HeaderFinder::new())]);
```
