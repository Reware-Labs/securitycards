# Security cards

Repository: `https://github.com/sgl-project/sglang#v0.5.16`
Category: authentication

## authentication

### Configure API Key Authentication on SGLang Gateways and Servers

**Use when**

When launching SGLang model gateways, routers, or OpenAI-compatible server instances that require API key verification on incoming requests.

**Secure rules**

**Rule 1: Enforce API key authentication on server endpoints using configured keys and bearer headers**

Explicitly configure the `api_key` parameter or CLI option during server or gateway launch so that incoming requests require valid authorization credentials. Callers must supply the token using the standard Authorization Bearer header.

```python
process = popen_launch_server(model_name, base_url, api_key="sk-secure-key-123")
client = openai.Client(api_key="sk-secure-key-123", base_url="http://localhost:30000/v1")
```

**Rule 2: Use constant-time comparison for Bearer token validation.**

SGLang relies on constant-time string comparison (`ConstantTimeEq`) for Bearer tokens during header validation to prevent timing side-channel attacks during header verification.

```rust
let auth_config = AuthConfig {
    api_key: Some(std::env::var("SGLANG_API_KEY").expect("API key must be set")),
};

let app = Router::new()
    .route("/v1/chat/completions", post(handle_chat))
    .layer(axum::middleware::from_fn_with_state(auth_config, auth_middleware));
```


### Configure JWT Authentication and JTI Replay Protection for Control Plane Routes

**Use when**

When securing the router control plane using JWT/OIDC identity integration and preventing token reuse.

**Secure rules**

**Rule 1: Specify both required JWT issuer and audience.**

When configuring JWT authentication via `build_control_plane_auth_config` or `RouterArgs`, developers must provide both `jwt_issuer` and `jwt_audience`. Supplying optional claims or role mappings without both fields will cause the configuration builder to drop the JWT configuration and leave control plane APIs unprotected.

```python
args = RouterArgs(
    jwt_issuer="https://auth.example.com/",
    jwt_audience="sglang-router",
    jwt_jwks_uri="https://auth.example.com/.well-known/jwks.json",
    jwt_role_claim="roles",
    jwt_role_mapping={"admin": "router_admin"},
)
```

**Rule 2: Enable JTI replay protection for control plane JWTs.**

Enable JTI replay protection when instantiating `JwtValidator` using `JwtValidator::from_config_with_options(jwt_config, true)` to ensure individual JWT tokens cannot be re-used within their validity window.

```rust
let validator = JwtValidator::from_config_with_options(jwt_config, true)
    .await
    .expect("Failed to create JWT validator with JTI replay protection");
```
