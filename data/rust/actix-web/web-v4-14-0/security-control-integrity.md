# Security cards

Repository: `https://github.com/actix/actix-web#web-v4.14.0`
Category: security control integrity

## security control integrity

### Register Middleware in Correct Order and Configure Fail-Closed Security Checks

**Use when**

When registering security middleware, conditional wrappers, or route handlers in Actix Web applications to ensure security controls execute properly and do not fail open.

**Secure rules**

**Rule 1: Register security middleware in reverse order using `.wrap()` so that outermost security checks execute first on incoming requests.**

Actix Web executes middleware in reverse order of registration via `.wrap()`. Ensure that authentication and authorization middleware are registered last in the builder chain so they act as the outermost layer and intercept requests before they reach inner handlers or middleware.

```rust
use actix_web::{web, App, HttpResponse};
use actix_web::middleware::{NormalizePath, TrailingSlash, Logger};

let app = App::new()
    .wrap(NormalizePath::new(TrailingSlash::Trim))
    .wrap(Logger::default())
    .wrap(my_auth_middleware);
```

**Rule 2: Ensure boolean runtime conditions guarding security middleware fail closed by defaulting to enabled.**

When using `Condition::new(bool, middleware)` to conditionally apply security controls, ensure that the boolean flag defaults to `true` in production environments so that a missing or unvalidated configuration does not silently bypass the middleware.

```rust
use actix_web::{middleware::Condition, App};

let enable_auth = std::env::var("DISABLE_AUTH")
    .map(|val| val != "1")
    .unwrap_or(true);

let app = App::new()
    .wrap(Condition::new(enable_auth, my_auth_middleware));
```

**Rule 3: Specify endpoint handlers before applying middleware wrappers on routes.**

Always specify the endpoint handler using `Route::to()` or `Route::service()` before chaining middleware using `Route::wrap()`. Actix Web v4.14.0 panics at runtime if handler methods are called after `wrap()` to prevent accidentally dropping route-level middleware.

```rust
web::get()
    .to(handler_fn)
    .wrap(middleware::Logger::default());
```
