# Security cards

Repository: `https://github.com/actix/actix-web#web-v4.14.0`
Category: api contract misuse

## api contract misuse

### Avoid order-dependent tuples in web::Query extraction

**Use when**

Extracting URL query parameters into strongly typed structures within Actix Web request handlers.

**Secure rules**

**Rule 1: Use named structs or map types instead of ordered tuples for `web::Query<T>` extraction.**

Because URL query strings consist of unordered key-value pairs, deserializing into types that rely on positional ordering will cause `serde_urlencoded` and Actix Web to panic during request handling. Define named structs derived with `Deserialize` to ensure robust type and ordering handling.

```rust
use actix_web::{get, web};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct SearchParams {
    pub query: String,
    pub page: Option<u32>,
}

#[get("/search")]
async fn search(info: web::Query<SearchParams>) -> String {
    format!("Searching for {} on page {:?}", info.query, info.page)
}
```


### Manage Actix Web Error Responses and Service Failures Securely

**Use when**

When handling HTTP errors, custom service failures, default fallback resources, and application state initialization to prevent information leakage and application panics.

**Secure rules**

**Rule 1: Pre-validate dynamic header inputs before passing them to client builders to prevent unhandled process panics.**

Always convert dynamic or user-controlled header names and values using fallible parse methods before supplying them to `ClientBuilder::add_default_header`. This prevents unexpected application panics during client initialization.

```rust
use awc::ClientBuilder;
use actix_web::http::header::{HeaderName, HeaderValue};

fn configure_client(builder: ClientBuilder, key: &str, val: &str) -> Result<ClientBuilder, String> {
    let name = HeaderName::from_bytes(key.as_bytes()).map_err(|e| e.to_string())?;
    let value = HeaderValue::from_str(val).map_err(|e| e.to_string())?;
    Ok(builder.add_default_header((name, value)))
}
```

**Rule 2: Sanitize HTTP error response bodies using error handler middleware to avoid leaking internal implementation details.**

Use `ErrorHandlers` middleware to intercept HTTP 4xx and 5xx error responses and replace raw diagnostic details or stack traces with generic, safe payloads.

```rust
use actix_web::dev::ServiceResponse;
use actix_web::middleware::{ErrorHandlerResponse, ErrorHandlers};
use actix_web::{App, Result};
use bytes::Bytes;

fn sanitize_server_error<B>(res: ServiceResponse<B>) -> Result<ErrorHandlerResponse<B>> {
    let (req, res) = res.into_parts();
    let res = res.set_body(Bytes::from("{\"error\":\"An internal error occurred.\"}"));
    let res = ServiceResponse::new(req, res)
        .map_into_boxed_body()
        .map_into_right_body();
    Ok(ErrorHandlerResponse::Response(res))
}

let app = App::new().wrap(
    ErrorHandlers::new().default_handler_server(sanitize_server_error)
);
```

**Rule 3: Implement custom `ResponseError` mappings for services to prevent raw internal errors from exposing sensitive diagnostics.**

When returning errors from custom services passed to `Route::service`, implement the `ResponseError` trait explicitly to return sanitized HTTP responses and status codes.

```rust
use actix_web::{error::ResponseError, http::StatusCode, HttpResponse, web, App};
use std::fmt;

#[derive(Debug)]
enum AppServiceError {
    DatabaseError(String),
}

impl fmt::Display for AppServiceError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Internal service error")
    }
}

impl ResponseError for AppServiceError {
    fn status_code(&self) -> StatusCode {
        StatusCode::INTERNAL_SERVER_ERROR
    }

    fn error_response(&self) -> HttpResponse {
        HttpResponse::build(self.status_code())
            .json("An unexpected error occurred. Please try again later.")
    }
}
```

**Rule 4: Propagate state initialization errors to ensure application startup fails fast on missing dependencies.**

Return explicit error variants from asynchronous state factories used in `App::data_factory` so Actix Web aborts startup rather than running with uninitialized dependencies.

```rust
use actix_web::{web, App, HttpResponse};

struct DatabasePool;

async fn init_db() -> Result<DatabasePool, String> {
    Err("Failed to connect to database".to_string())
}

let app = App::new()
    .data_factory(|| init_db())
    .service(web::resource("/").to(|| HttpResponse::Ok()));
```
