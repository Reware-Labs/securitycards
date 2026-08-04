# Security cards

Repository: `https://github.com/salvo-rs/salvo#v0.94.0`
Category: configuration source integrity

## configuration source integrity

### Disable query parameter configuration overrides in Swagger UI

**Use when**

Configuring Swagger UI endpoints in Salvo OpenAPI integrations where untrusted users could manipulate configuration parameters via URL query parameters.

**Secure rules**

**Rule 1: Explicitly disable query parameter configuration overrides for Swagger UI instances.**

Keep the `query_config_enabled` option disabled or explicitly set it to `false` to prevent attackers from overriding configuration parameters via URL query parameters and loading malicious external schemas.

```rust
use salvo_oapi::swagger_ui::Config;

let config = Config::new(["/api-docs/openapi.json"])
    .query_config_enabled(false);
```
