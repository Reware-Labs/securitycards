# Security cards

Repository: `https://github.com/tokio-rs/axum#axum-v0.8.9`
Category: api contract misuse

## api contract misuse

### Place Request Body Consuming Extractors as the Final Handler Parameter

**Use when**

When defining axum handler functions that use extractors to parse request bodies or path parameters.

**Secure rules**

**Rule 1: Position body-consuming extractors as the final argument in the handler signature.**

Because extractors are evaluated sequentially and body-consuming extractors exhaust the request body stream, place extractors such as `Json`, `Form`, `Multipart`, `Bytes`, `String`, or `RawBody` after all other parameters like `State`, `Path`, or `HeaderMap` to prevent handler processing failures.

```rust
use axum::extract::{Path, State};
use axum::Json;
use serde::Deserialize;

#[derive(Deserialize)]
struct CreatePayload {
    name: String,
}

async fn handle_create(
    State(state): State<AppState>,
    Path(id): Path<u64>,
    Json(payload): Json<CreatePayload>,
) -> &'static str {
    "created"
}
```


### Sanitize and Handle Extractor and Application Errors Explicitly

**Use when**

Building request handlers, extractors, and services in Axum where input parsing, deserialization, or internal operations can fail.

**Secure rules**

**Rule 1: Sanitize internal error details when implementing custom extractor rejections.**

When deriving `FromRequest` with custom rejection handling, ensure that your `From<ExtractorRejection>` implementation returns sanitized HTTP error responses rather than forwarding raw internal error details to clients.

```rust
use axum_macros::FromRequest;
use axum::{
    extract::rejection::JsonRejection,
    response::{IntoResponse, Response},
    http::StatusCode,
    Json,
};
use serde_json::json;

#[derive(FromRequest)]
#[from_request(via(axum::Json), rejection(MyRejection))]
struct MyJson<T>(T);

struct MyRejection(Response);

impl From<JsonRejection> for MyRejection {
    fn from(_rejection: JsonRejection) -> Self {
        let response = (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "Invalid request payload" })),
        ).into_response();

        MyRejection(response)
    }
}

impl IntoResponse for MyRejection {
    fn into_response(self) -> Response {
        self.0
    }
}
```

**Rule 2: Handle extractor rejections explicitly using Result wrappers.**

Wrap extractors in `Result<T, Rejection>` within handler parameters to capture failures explicitly. Translate extractor failures into structured, safe HTTP error responses instead of relying on default framework errors.

```rust
use axum::{
    extract::{Json, rejection::JsonRejection},
    http::StatusCode,
    response::IntoResponse,
};
use serde_json::Value;

async fn create_user(
    payload: Result<Json<Value>, JsonRejection>,
) -> impl IntoResponse {
    match payload {
        Ok(Json(_data)) => (StatusCode::OK, "Success".to_string()),
        Err(JsonRejection::MissingJsonContentType(_)) => (
            StatusCode::BAD_REQUEST,
            "Missing Content-Type: application/json header".to_string(),
        ),
        Err(_) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to process request".to_string(),
        ),
    }
}
```

**Rule 3: Convert fallible service errors into safe HTTP responses using handle_error.**

When routing HTTP requests to fallible Tower services using functions like `get_service` or `on_service`, always handle service errors by converting them into infallible method routers using `.handle_error(...)` to prevent raw system exceptions from reaching clients.

```rust
use axum::{
    body::Body,
    extract::Request,
    http::StatusCode,
    routing::get_service,
    Router,
};
use http::Response;
use tower::service_fn;

async fn fallible_service(_req: Request) -> Result<Response<Body>, String> {
    Err("sensitive DB query failed".into())
}

let service = service_fn(fallible_service);

let app: Router = Router::new().route(
    "/data",
    get_service(service).handle_error(|err: String| async move {
        tracing::error!("Service error: {}", err);
        (StatusCode::INTERNAL_SERVER_ERROR, "An internal error occurred")
    }),
);
```

**Rule 4: Map application errors to custom response types implementing IntoResponse.**

Return dedicated error types that implement `IntoResponse` (or use `Result<T, CustomError>`) instead of leaking raw error objects or unformatted strings, encapsulating internal errors safely.

```rust
use axum::{http::StatusCode, response::{IntoResponse, Response}};

pub struct AppError(pub anyhow::Error);

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        tracing::error!(error = %self.0, "Internal error occurred");
        (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error").into_response()
    }
}

async fn handler() -> Result<&'static str, AppError> {
    Ok("Hello, World!")
}
```
