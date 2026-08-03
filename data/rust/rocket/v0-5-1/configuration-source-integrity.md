# Security cards

Repository: `https://github.com/rwf2/Rocket#v0.5.1`
Category: configuration source integrity

## configuration source integrity

### Configure worker thread limits through trusted Figment and environment sources

**Use when**

Configuring concurrency and worker thread parameters for Rocket applications using `Config::figment()` or trusted environment variables.

**Secure rules**

**Rule 1: Set the `workers` configuration parameter only through trusted sources such as `ROCKET_WORKERS` or `Rocket.toml` evaluated via `Config::figment()`.**

Ensure that concurrency parameters like `workers` are configured strictly through trusted channels like `ROCKET_WORKERS` or `Rocket.toml` evaluated via `Config::figment()`, as dynamic custom provider merges or runtime configuration updates are ignored by Rocket due to async runtime initialization constraints.

```rust
let figment = rocket::Config::figment();
rocket::custom(figment);
```
