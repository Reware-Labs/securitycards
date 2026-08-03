# Security cards

Repository: `https://github.com/tokio-rs/axum#axum-v0.8.9`

## Category: access control

### Enforce Route-Level Authorization and Access Control Early

**Use when**

When implementing access control, permission checks, or tenant isolation middleware and route layers in an Axum application.

**Secure rules**

**Rule 1: Short-circuit request execution immediately upon authorization failure in extractors or middleware.**

When writing custom middleware or extractors for access control, return an error response immediately when validation fails to prevent unauthorized requests from reaching downstream handlers.

```rust
async fn auth_middleware(
    headers: HeaderMap,
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    match headers.get("authorization") {
        Some(token) if token_is_valid(token) => Ok(next.run(request).await),
        _ => Err(StatusCode::UNAUTHORIZED),
    }
}
```


## Category: api contract misuse

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


## Category: authentication

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


## Category: boundary control

### Apply Request-Modifying Middleware at the Router Service Boundary

**Use when**

Applying middleware that modifies request URIs or properties affecting routing decisions before requests are handled by Axum.

**Secure rules**

**Rule 1: Wrap the complete Router service with request-modifying middleware instead of using Router::layer.**

When modifying request URIs or state before routing takes place, register your middleware by wrapping the entire `Router` service. Using `Router::layer` executes middleware after Axum has already performed HTTP route matching, which can cause unexpected route execution or bypass security boundaries.

```rust
use tower::Layer;
use axum::{Router, ServiceExt, extract::Request};

fn rewrite_request_uri(req: Request) -> Request {
    req
}

let middleware = tower::util::MapRequestLayer::new(rewrite_request_uri);
let app = Router::new().route("/api", get(handler));

let app_with_middleware = middleware.layer(app);
```


## Category: cryptography

### Use signed or private cookie jars for sensitive data

**Use when**

Handling sensitive session state, tokens, or confidential data in client cookies using axum-extra.

**Secure rules**

**Rule 1: Enable signed or private cookie jars to enforce cryptographic integrity and encryption on cookies.**

Add the appropriate features to `Cargo.toml` for `axum-extra` and extract cookies using `SignedCookieJar` or `PrivateCookieJar` instead of a plain `CookieJar` to prevent tampering and unauthorized reading.

```toml
axum-extra = { version = "0.9", features = ["cookie-signed", "cookie-private"] }
```


## Category: csrf

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


## Category: deserialization

### Use Cow with Serde borrow attribute for safe zero-copy JSON deserialization

**Use when**

When implementing zero-copy request parsing in Axum using `JsonDeserializer` where fields might contain escape sequences.

**Secure rules**

**Rule 1: Use `std::borrow::Cow` decorated with `#[serde(borrow)]` for fields that may contain escape sequences during deserialization.**

When parsing request payloads with `JsonDeserializer`, raw `&'a str` or `&'a [u8]` fields will fail if they encounter escape sequences like `\"` or `\n`. Developers must use `std::borrow::Cow<'a, str>` or `std::borrow::Cow<'a, [u8]>` with `#[serde(borrow)]` to enable zero-copy borrowing while safely falling back to owned allocations when escape sequences are encountered.

```rust
use axum_extra::extract::JsonDeserializer;
use axum::response::{IntoResponse, Response};
use serde::Deserialize;
use std::borrow::Cow;
use http::StatusCode;

#[derive(Deserialize)]
struct SafePayload<'a> {
    #[serde(borrow)]
    username: Cow<'a, str>,
}

async fn handle_upload(deserializer: JsonDeserializer<SafePayload<'_>>) -> Response {
    let payload = match deserializer.deserialize() {
        Ok(data) => data,
        Err(rejection) => return rejection.into_response(),
    };

    StatusCode::OK.into_response()
}
```


## Category: input contract definition

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


## Category: input interpretation safety

### Validate percent-decoded URL path parameters to prevent path traversal

**Use when**

Extracting URL path parameters from incoming requests where percent-decoding could transform traversal sequences.

**Secure rules**

**Rule 1: Parse path parameters into strongly typed identifiers rather than raw strings to prevent alternate interpretations and traversal attacks.**

Axum automatically percent-decodes URL path parameters and rejects non-UTF-8 content, but decoding can expose traversal sequences like `../`. Developers must prefer deserializing path parameters directly into strongly typed identifiers such as `Uuid` or integers instead of raw `String` parameters.

```rust
use axum::extract::Path;
use uuid::Uuid;

async fn get_user_avatar(Path(user_id): Path<Uuid>) {
    // user_id is guaranteed to be a valid Uuid, preventing path traversal
}
```


## Category: interface protocol hardening

### Configure Security and CORS Headers on Axum Responses

**Use when**

Configuring security headers and cross-origin resource sharing policies for HTTP responses in an axum web application.

**Secure rules**

**Rule 1: Restrict cross-origin resource sharing origins, methods, and headers explicitly using `CorsLayer`.**

When configuring Cross-Origin Resource Sharing HTTP headers using `tower_http::cors::CorsLayer` on an axum `Router`, explicitly restrict allowed origins, HTTP methods, and allowed request headers to strictly required endpoints and origins, avoiding wildcards.

```rust
use axum::{http::{HeaderValue, Method, header::CONTENT_TYPE}, routing::get, Router};
use tower_http::cors::CorsLayer;

let app = Router::new()
    .route("/json", get(json_handler))
    .layer(
        CorsLayer::new()
            .allow_origin("http://localhost:3000".parse::<HeaderValue>().unwrap())
            .allow_methods([Method::GET, Method::POST])
            .allow_headers([CONTENT_TYPE])
    );
```

**Rule 2: Attach systematic security response headers using response mapping middleware.**

Use `map_response` middleware to append security response headers across routes, ensuring headers like `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, and `Strict-Transport-Security` are systematically set on outgoing responses.

```rust
use axum::{
    Router,
    routing::get,
    middleware::map_response,
    response::Response,
    http::HeaderValue,
};

async fn set_security_headers<B>(mut response: Response<B>) -> Response<B> {
    let headers = response.headers_mut();
    headers.insert("x-content-type-options", HeaderValue::from_static("nosniff"));
    headers.insert("x-frame-options", HeaderValue::from_static("DENY"));
    headers.insert("content-security-policy", HeaderValue::from_static("default-src 'self'"));
    response
}

let app = Router::new()
    .route("/", get(|| async { "Hello, World!" }))
    .layer(map_response(set_security_headers));
```


### Sanitize redirect location strings to prevent header parsing failures

**Use when**

When constructing HTTP redirection responses from user-supplied paths or parameters in Axum handlers.

**Secure rules**

**Rule 1: Validate redirect paths against header-safe character sets to prevent response construction failures and server errors.**

When using `Redirect` to convert location strings into HTTP header values, ensure inputs do not contain invalid control characters like newlines or carriage returns. Unchecked input containing these characters causes axum to encounter conversion failures and return a `500 Internal Server Error` response instead of setting the header correctly.

```rust
use axum::response::Redirect;

pub fn sanitize_and_redirect(path: &str) -> Result<Redirect, &'static str> {
    if path.contains('\n') || path.contains('\r') {
        return Err("Invalid redirect character");
    }
    Ok(Redirect::to(path))
}
```


## Category: network boundary

### Restrict Network Interface Exposure When Binding Listeners

**Use when**

Binding network interfaces with `tokio::net::TcpListener` for `axum::serve` to control client access boundaries.

**Secure rules**

**Rule 1: Bind network listeners to loopback interfaces rather than wildcards when services should not be exposed externally.**

Explicitly choose the network address interface when binding `tokio::net::TcpListener` for `axum::serve`. Bind to `127.0.0.1` or `[::1]` for localhost-only access to prevent unintended external reachability.

```rust
let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await.unwrap();
axum::serve(listener, app).await;
```


## Category: output encoding

### Escape untrusted input before rendering HTML responses

**Use when**

Rendering dynamic user-supplied data inside `Html` response types in Axum handlers.

**Secure rules**

**Rule 1: HTML-escape untrusted text before wrapping it in `Html` responses.**

Axum's `Html` response type sends content as `text/html` without performing automatic HTML escaping. Direct string formatting of user-controlled input into `Html` can expose application users to Cross-Site Scripting. User input must be explicitly escaped or processed using an HTML escaping library or secure templating engine prior to wrapping in `Html`.

```rust
use axum::response::Html;

async fn handler(ValidatedForm(input): ValidatedForm<NameInput>) -> Html<String> {
    let escaped_name = html_escape::encode_safe(&input.name);
    Html(format!("<h1>Hello, {}!</h1>", escaped_name))
}
```


## Category: resource exhaustion

### Enforce Request Body and Concurrency Limits to Prevent Resource Exhaustion

**Use when**

Building or configuring Axum HTTP routes and services that handle incoming request bodies, file uploads, or concurrent workloads.

**Secure rules**

**Rule 1: Enforce explicit request body size limits on all routes and file uploads to prevent memory exhaustion from oversized payloads.**

Rely on Axum's default body limits or use `DefaultBodyLimit::max` or `RequestBodyLimitLayer` to restrict payload sizes before processing requests or buffering streams in memory or middleware.

```rust
use axum::extract::DefaultBodyLimit;
use axum::Router;

let app = Router::new()
    .layer(DefaultBodyLimit::max(1024 * 1024));
```

**Rule 2: Apply global concurrency limits and timeouts to protect the application against denial-of-service attacks.**

Combine request body limit configurations with timeout and concurrency layers using `ServiceBuilder` to limit concurrent connections and prevent thread pool and connection exhaustion.

```rust
let app = Router::new()
    .layer(
        ServiceBuilder::new()
            .layer(HandleErrorLayer::new(handle_error))
            .load_shed()
            .concurrency_limit(1024)
            .timeout(Duration::from_secs(10))
    );
```


## Category: secret handling

### Load authentication and cryptographic secrets from runtime environment variables

**Use when**

Configuring application state, middleware layers, or cryptographic keys that require sensitive credentials and secrets.

**Secure rules**

**Rule 1: Load cryptographic keys and authentication tokens dynamically from runtime environment variables rather than embedding them in source code.**

Always read secrets from environment variables or trusted secret providers at startup. Use `std::env::var` to retrieve values like `JWT_SECRET`, `COOKIE_SECRET_KEY`, or `ADMIN_BEARER_TOKEN` and fail startup if the configuration is missing.

```rust
let admin_token = std::env::var("ADMIN_BEARER_TOKEN")
    .expect("ADMIN_BEARER_TOKEN environment variable must be set");

let admin_router = Router::new()
    .route("/keys", delete(delete_all_keys))
    .layer(ValidateRequestHeaderLayer::bearer(&admin_token));
```


## Category: security control integrity

### Apply Security Middleware After Defining Target Routes in Axum

**Use when**

Registering security-critical middleware layers such as authentication, authorization, or rate limiting on an Axum Router.

**Secure rules**

**Rule 1: Ensure all target routes are defined on the Router before applying `.layer()` to prevent security bypasses.**

In Axum, `Router::layer` applies middleware only to existing routes attached prior to the `.layer()` call. Any routes added afterwards will completely bypass the security controls. Always define your routes first and then apply the middleware layer.

```rust
use axum::{routing::get, Router};
use tower_http::trace::TraceLayer;

let app = Router::new()
    .route("/foo", get(|| async {}))
    .route("/bar", get(|| async {}))
    .layer(TraceLayer::new_for_http());
```


## Category: session management

### Set secure cookie flags and return updated CookieJar instances in Axum handlers

**Use when**

Managing session identifiers or authentication cookies via response headers and cookie jars in Axum handlers.

**Secure rules**

**Rule 1: Explicitly format session cookies with restrictive security directives and return updated cookie jars from handlers.**

When returning session tokens or session identifier cookies, explicitly configure restrictive security directives including `SameSite=Lax`, `HttpOnly`, and `Secure`. Always return updated `CookieJar` or `PrivateCookieJar` instances from response handlers when adding, updating, or removing cookies to ensure that `Set-Cookie` headers are properly emitted.

```rust
use axum::response::Redirect;
use axum_extra::extract::cookie::{CookieJar, Cookie};

async fn login_handler(jar: CookieJar) -> (CookieJar, Redirect) {
    let updated_jar = jar.add(Cookie::new("session_id", "token_123"));
    (updated_jar, Redirect::to("/dashboard"))
}
```
