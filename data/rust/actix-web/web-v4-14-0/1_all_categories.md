# Security cards

Repository: `https://github.com/actix/actix-web#web-v4.14.0`

## Category: access control

### Enforce access control using guards, resource constraints, and middleware

**Use when**

Enforcing access control, permissions, and request filtering across routes, resources, scopes, and middleware handlers in Actix Web.

**Secure rules**

**Rule 1: Restrict access to endpoints using route-level guards and middleware wraps**

Attach custom guard functions or authorization middleware directly to route macros using `guard = "..."` and `wrap = "..."` to ensure requests are filtered before reaching the handler function.

```rust
use actix_web::{get, guard, HttpResponse, Responder};

fn admin_guard(ctx: &guard::GuardContext) -> bool {
    ctx.head().headers().contains_key("x-admin-token")
}

#[get("/admin", guard = "admin_guard", wrap = "actix_web::middleware::Logger")]
async fn admin_panel() -> impl Responder {
    HttpResponse::Ok().body("Admin Panel")
}
```

**Rule 2: Enforce request prerequisites uniformly using resource and scope guards**

Use `Resource::guard()` and `Scope::guard(...)` to enforce security constraints, headers, or policy checks uniformly across all nested resources and services within a path prefix or resource pattern.

```rust
use actix_web::{web, guard, App, HttpResponse};

let app = App::new().service(
    web::scope(
        "/admin"
    )
    .guard(guard::Header("X-Admin-Token", "secret"))
    .route("/dashboard", web::get().to(|| HttpResponse::Ok()))
);
```

**Rule 3: Short-circuit unauthorized requests in custom function middleware**

Use `from_fn` middleware to short-circuit unauthorized requests early by returning an error or early response via `req.into_response(...)` without executing `next.call(req)`.

```rust
async fn authorize_request(
    req: ServiceRequest,
    next: Next<impl MessageBody + 'static>,
) -> Result<ServiceResponse<impl MessageBody>, Error> {
    if !is_authorized(&req) {
        return Ok(req.into_response(HttpResponse::Unauthorized().finish()).map_into_right_body());
    }
    let res = next.call(req).await?;
    Ok(res.map_into_left_body())
}
```


## Category: api contract misuse

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


## Category: boundary control

### Restrict Route Registration Order and Segment Boundaries to Enforce Request Boundaries

**Use when**

When registering routes, scopes, and dynamic path segments in Actix-web applications to ensure requests are routed through proper security boundaries.

**Secure rules**

**Rule 1: Order specific route and service registrations before broader patterns and static file catch-alls.**

Ensure that specific application routes and API services are registered before mounting broader prefix matching or catch-all static file services like `Files::new`. Registering broad catch-alls or generic scope prefixes first causes request matching to short-circuit prematurely, shadowing specialized handlers and bypassing route-specific security checks.

```rust
use actix_web::{web, App, HttpResponse, Responder};
use actix_files::Files;

async fn api_handler() -> impl Responder {
    HttpResponse::Ok().body("OK")
}

let app = App::new()
    .route("/api/health", web::get().to(api_handler))
    .service(Files::new("/", "./static").index_file("index.html"));
```

**Rule 2: Restrict custom dynamic segment patterns to prevent path traversal across segments.**

When defining custom dynamic segment patterns using the `{name:regex}` syntax, ensure the regular expression explicitly restricts matched characters and does not inadvertently match slash `/` characters. Allowing slashes inside custom dynamic segment regexes permits input to cross segment boundaries and bypass route scoping controls.

```rust
use actix_router::ResourceDef;

let resource = ResourceDef::new(r"/user/{id:\d+}");
assert!(resource.is_match("/user/123"));
assert!(!resource.is_match("/user/123/details"));
```


## Category: cryptography

### Restrict SHA1 hashing strictly to WebSocket handshake verification

**Use when**

When performing RFC 6455 WebSocket handshake challenge-response generation using `hash_key`.

**Secure rules**

**Rule 1: Use the `hash_key` function strictly for WebSocket handshake challenge-response protocol compliance.**

Calculate `base64(sha1(key + WS_GUID))` solely to perform the RFC 6455 WebSocket handshake challenge-response. Developers must not use `hash_key` or SHA-1 for general-purpose cryptographic security, data integrity verification, or credential hashing.

```rust
use actix_http::ws::hash_key;

// Correct: Calculating Sec-WebSocket-Accept response header per RFC 6455
let client_key = b"dGhlIHNhbXBsZSBub25jZQ==";
let accept_value = hash_key(client_key);
assert_eq!(accept_value.len(), 28);
```


## Category: deserialization

### Validate response payload limits and format during JSON parsing

**Use when**

Deserializing structured response data from remote endpoints via `ClientResponse::json()` where content-type checks and payload limits prevent memory exhaustion or unexpected parsing.

**Secure rules**

**Rule 1: Rely on `ClientResponse::json()` to enforce an explicit `application/json` Content-Type check and default payload size limits instead of manually parsing raw bytes.**

When deserializing JSON responses using `ClientResponse::json()`, ensure that responses are handled via built-in parsing methods that enforce content type validation and strict payload length boundaries to prevent memory exhaustion and unexpected parsing behaviors.

```rust
#[derive(serde::Deserialize)]
struct MyResponse {
    id: u64,
}

let mut res = client.get("https://example.com/api")
    .send()
    .await?;

// json() enforces Content-Type matching and a 2 MiB payload limit by default
let data: MyResponse = res.json().await?;
```


## Category: escape hatch

### Restrict Unsafe Transport Features and Avoid dangerous-h2c in Production

**Use when**

Configuring network client transport capabilities and dependencies where transport-layer security features must be enforced instead of unencrypted bypasses.

**Secure rules**

**Rule 1: Do not enable the `dangerous-h2c` feature flag in production deployments.**

Ensure that `dangerous-h2c` is omitted from `Cargo.toml` dependencies so that unencrypted TCP streams are not wrapped as mock TLS connections. Only enable standard TLS features such as `rustls-0_23-webpki-roots` or `openssl` for network client communication.

```toml
[dependencies]
awc = { version = "3.5", features = ["rustls-0_23-webpki-roots"] }
```


## Category: file handling

### Safely Handle and Restrict File Paths During Static Asset Serving

**Use when**

Configuring static file serving or processing user-influenced file paths and uploads to prevent unauthorized file access, path traversal, and dotfile disclosure.

**Secure rules**

**Rule 1: Isolate static file services to dedicated asset directories rather than broad root paths.**

Avoid mounting file services against broad roots like `.` or directories containing application source code. Always mount static file services against dedicated, isolated directories specifically intended for public asset distribution.

```rust
use actix_web::App;
use actix_files::Files;

let app = App::new()
    .service(Files::new("/static", "./public").prefer_utf8(true));
```

**Rule 2: Keep hidden file serving disabled to prevent exposing sensitive dotfiles.**

Do not call `use_hidden_files()` on `Files` unless serving dotfiles is an explicit requirement, as default configurations properly restrict access to files and directories starting with a dot.

```rust
use actix_files::Files;
use actix_web::App;

let app = App::new()
    .service(
        Files::new("/static", "./static")
    );
```

**Rule 3: Implement path filters to block symbolic links and unauthorized paths.**

Use `.path_filter()` to enforce explicit path constraints and prevent symlink traversal before static files are retrieved from disk.

```rust
use std::path::Path;
use actix_files::Files;

let files_service = Files::new("/", "./static").path_filter(|path, _| {
    path.components().count() == 1
        && Path::new("./static")
            .join(path)
            .symlink_metadata()
            .map(|m| !m.file_type().is_symlink())
            .unwrap_or(false)
});
```


## Category: input contract definition

### Enforce Strict Input Boundaries and Reject Unknown Multipart Fields

**Use when**

Handling structured form and multipart file uploads where unexpected fields or duplicate parameters must be rejected to prevent parameter pollution.

**Secure rules**

**Rule 1: Configure strict rejection attributes on multipart form structs to deny unknown fields and duplicate parameters.**

Use the `deny_unknown_fields` and `duplicate_field = "deny"` macro attributes on `MultipartForm` structs to strictly enforce input boundaries, rejecting parameter pollution and unintended field overrides.

```rust
#[derive(MultipartForm)]
#[multipart(deny_unknown_fields, duplicate_field = "deny")]
struct StrictProfileForm {
    pub username: Text<String>,
    pub email: Text<String>,
}
```


## Category: input interpretation safety

### Differentiate raw and percent-decoded cookie representations during retrieval

**Use when**

Retrieving and validating request cookies or path match information where percent-decoding behavior affects security decisions and cryptographic checks.

**Secure rules**

**Rule 1: Use raw cookie retrieval methods when validating unmodified cookie byte sequences**

Use `cookies_raw()` or `cookie_raw()` when checking HMAC signatures or exact cookie values that should not be percent-decoded. Standard cookie methods automatically percent-decode names and values, which can alter signatures or tokens containing encoded characters.

```rust
use actix_web::{HttpRequest, HttpResponse, Responder};

pub async fn token_check_handler(req: HttpRequest) -> impl Responder {
    if let Some(cookie) = req.cookie_raw("session_sig") {
        let raw_token = cookie.value();
        if is_valid_signature(raw_token) {
            return HttpResponse::Ok().finish();
        }
    }
    HttpResponse::Unauthorized().finish();
}

fn is_valid_signature(_sig: &str) -> bool {
    true
}
```

**Rule 2: Validate raw match info parameters before using them in path operations**

Be aware that `req.match_info()` preserves sequences such as `%2F`, `%25`, and `%2B` without percent-decoding to maintain path boundary integrity. Explicitly decode or validate these values before using them in file access or routing logic.

```rust
use actix_web::{HttpRequest, HttpResponse, Responder};

pub async fn get_resource(req: HttpRequest) -> impl Responder {
    if let Some(param) = req.match_info().get("filename") {
        if param.contains('/') || param.contains("..") {
            return HttpResponse::BadRequest().body("Invalid parameter");
        }
    }
    HttpResponse::Ok().finish();
}
```


## Category: interface protocol hardening

### Configure and Enforce HTTP Security Headers across Applications, Error Responses, and Routes

**Use when**

Developing Actix Web applications and defining middleware, error handlers, or routes that require security headers like Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options, or Content-Security-Policy.

**Secure rules**

**Rule 1: Attach standard HTTP security headers globally using the DefaultHeaders middleware.**

Use Actix Web's DefaultHeaders middleware exported from the middleware module to attach security headers to all outgoing HTTP responses across an App or Scope.

```rust
use actix_web::{middleware::DefaultHeaders, App, HttpResponse, web};

let app = App::new()
    .wrap(
        DefaultHeaders::new()
            .add(("X-Content-Type-Options", "nosniff"))
            .add(("X-Frame-Options", "DENY"))
            .add(("Strict-Transport-Security", "max-age=31536000; includeSubDomains"))
    )
    .route("/", web::get().to(|| async { HttpResponse::Ok().body("Secure") }));
```

**Rule 2: Explicitly set security headers on HTTP error responses using ErrorHandlers middleware.**

When handling HTTP errors with ErrorHandlers middleware, ensure custom error handlers explicitly inspect and set mandatory security headers on the returned ServiceResponse because standard route middleware may not apply to unhandled error paths.

```rust
use actix_web::{
    dev::ServiceResponse,
    http::header,
    middleware::{ErrorHandlerResponse, ErrorHandlers},
    Result,
};

fn add_security_headers<B>(mut res: ServiceResponse<B>) -> Result<ErrorHandlerResponse<B>> {
    let headers = res.response_mut().headers_mut();
    headers.insert(header::X_CONTENT_TYPE_OPTIONS, header::HeaderValue::from_static("nosniff"));
    headers.insert(header::X_FRAME_OPTIONS, header::HeaderValue::from_static("DENY"));
    Ok(ErrorHandlerResponse::Response(res.map_into_left_body()))
}

let error_middleware = ErrorHandlers::new().default_handler(add_security_headers);
```

**Rule 3: Apply route-level security headers after handler definition using wrap.**

When enforcing HTTP security headers on specific routes using middleware like DefaultHeaders via Route::wrap, always call `.to()` or `.service()` before `.wrap()` to avoid runtime panics in Actix Web v4.14.0.

```rust
use actix_web::{middleware::DefaultHeaders, web, HttpResponse};

let route = web::get()
    .to(|| async { HttpResponse::Ok().finish() })
    .wrap(
        DefaultHeaders::new()
            .add(("X-Content-Type-Options", "nosniff"))
            .add(("X-Frame-Options", "DENY"))
    );
```


### Enforce Strict HTTP Framing and Protocol Rules to Prevent Request Smuggling

**Use when**

When handling incoming HTTP/1.x requests, configuring HTTP/2 native framing, or managing client connection reuse in Actix Web and `awc`.

**Secure rules**

**Rule 1: Rely on Actix Web's built-in header validation to reject conflicting or malformed framing headers.**

Actix Web automatically enforces strict HTTP/1.1 framing validation during header decoding to reject requests with multiple `Content-Length` headers, invalid `Content-Length` formatting, conflicting `Transfer-Encoding` and `Content-Length` headers, or HTTP/1.0 `Transfer-Encoding` headers. Do not attempt to bypass or alter these standard HTTP protocol constraints.

**Rule 2: Use native HTTP/2 framing without manually injecting transfer-encoding headers.**

When streaming request bodies over HTTP/2 using `awc::ClientRequest::send_stream`, rely on `awc`'s built-in HTTP/2 framing mechanism and do not manually append `Transfer-Encoding` headers, as HTTP/2 uses native DATA frames and forbids transfer encoding.

```rust
use actix_web::http::Version;
use awc::Client;
use futures_util::stream;

let client = Client::new();
let response = client
    .post("https://localhost:8443/upload")
    .version(Version::HTTP_2)
    .send_stream(stream::once(async {
        Ok::<_, actix_web::Error>(bytes::Bytes::from_static(b"data stream payload"))
    }))
    .await?;
```

**Rule 3: Maintain default client mode frame masking when communicating with WebSocket endpoints.**

By default, `WebsocketsRequest` operates in standard client mode, automatically applying payload masking to outbound frames per RFC 6455 §5.3. Refrain from calling `server_mode()` when acting as a WebSocket client to prevent protocol misinterpretation.

```rust
let (_resp, connection) = client
    .ws("wss://example.com/socket")
    .connect()
    .await?;
```

**Rule 4: Maintain connection keep-alive and lifetime configurations to discard tainted pooled connections.**

When reusing connections from the pool, `awc` checks idle HTTP/1 connections for unread data before issuing new requests. Configure connector limits and keep-alive durations on the client builder to allow proper socket recycling and prevent HTTP response smuggling.

```rust
use awc::Client;
use std::time::Duration;

let client = Client::builder()
    .connector(
        awc::Connector::new()
            .conn_keep_alive(Duration::from_secs(15))
            .conn_lifetime(Duration::from_secs(600))
    )
    .finish();
```


### Validate WebSocket Subprotocols and Enforce HTTP/1.1 Tunnel Constraints

**Use when**

When establishing WebSocket connections, setting up subprotocols, or opening socket tunnels in Actix Web and `awc`.

**Secure rules**

**Rule 1: Specify allowed WebSocket subprotocols explicitly using an explicit allowlist.**

Use `WsResponseBuilder` or `handshake_with_protocols` with an explicit protocol allowlist to negotiate WebSocket subprotocols safely and prevent application state corruption.

```rust
use actix_web::{get, web, Error, HttpRequest, HttpResponse};
use actix_web_actors::ws;

#[get("/ws")]
async fn websocket(req: HttpRequest, stream: web::Payload) -> Result<HttpResponse, Error> {
    ws::WsResponseBuilder::new(MyWsActor, &req, stream)
        .protocols(&["v1.proto.example.com", "v2.proto.example.com"])
        .start()
}
```

**Rule 2: Enforce HTTP/1.1 when opening raw socket tunnels.**

When establishing standard HTTP tunnels using `Connection::open_tunnel`, ensure that the connection is negotiated over HTTP/1.1, as `awc` explicitly disallows socket tunneling over HTTP/2 connections.

```rust
use awc::Client;
use actix_http::http::Version;

let client = Client::builder()
    .max_http_version(Version::HTTP_11)
    .finish();
```


## Category: network boundary

### Configure Trusted Reverse Proxies and Direct Peer Verification for Network Boundaries

**Use when**

When configuring IP-based access controls, rate limiting, or network logging in Actix Web services deployed behind reverse proxies or handling direct client connections.

**Secure rules**

**Rule 1: Use direct peer socket addresses for IP-based access controls and rate limiting.**

Prefer `req.peer_addr()` over `req.connection_info()` when implementing IP-based authorization or security boundaries unless trusted proxy settings are explicitly verified. Reconstructed connection info relying on `Forwarded` or `X-Forwarded-For` headers can be spoofed by untrusted upstream clients.

```rust
use actix_web::{HttpRequest, HttpResponse, Responder};

pub async fn restricted_handler(req: HttpRequest) -> impl Responder {
    match req.peer_addr() {
        Some(addr) if addr.ip().is_loopback() => HttpResponse::Ok().body("Admin Panel"),
        _ => HttpResponse::Forbidden().finish(),
    }
}
```

**Rule 2: Avoid trusting remote IP headers in loggers without a trusted reverse proxy.**

When configuring the `Logger` middleware with the `%{r}a` format specifier, ensure that the application runs behind a trusted reverse proxy that sanitizes or overwrites forwarding headers. Otherwise, use `%a` for direct TCP peer IP logging.

```rust
use actix_web::middleware::Logger;

let logger = Logger::new("%a \"%r\" %s %b");

let proxy_logger = Logger::new("%{r}a \"%r\" %s %b");
```


## Category: output encoding

### Prevent Cross-Site Scripting (XSS) by setting explicit content types and encoding output

**Use when**

Building HTTP responses, serving files, or returning string responders that include dynamic user data in Actix Web applications.

**Secure rules**

**Rule 1: Explicitly set attachment dispositions or non-executable content types when serving user files.**

When serving untrusted user files using `NamedFile`, explicitly force attachment disposition with `set_content_disposition` or override the content type to a non-executable type like `application/octet-stream` to prevent browsers from executing inline scripts.

```rust
use actix_files::NamedFile;
use actix_web::http::header::{ContentDisposition, DispositionType};

async fn serve_user_file() -> actix_web::Result<NamedFile> {
    let file = NamedFile::open_async("./uploads/user_doc.html").await?;
    Ok(file.set_content_disposition(ContentDisposition {
        disposition: DispositionType::Attachment,
        parameters: vec![],
    }))
}
```

**Rule 2: Specify explicit safe content types or structured builders for responses containing dynamic data.**

When building responses with `HttpResponseBuilder` or `ResponseBuilder`, explicitly specify strict MIME types like `mime::APPLICATION_JSON` or `mime::TEXT_PLAIN_UTF_8` for non-HTML payloads, or use structured builders like `.json()` to avoid MIME-sniffing vulnerabilities.

```rust
use actix_web::{HttpResponse, http::header};

pub async fn safe_text_response(user_input: String) -> HttpResponse {
    HttpResponse::Ok()
        .content_type(mime::TEXT_PLAIN_UTF_8)
        .body(user_input)
}
```

**Rule 3: HTML-encode user-supplied data before overriding response content types to HTML.**

Actix Web default string responders automatically set `text/plain`, preventing script execution. When using `.customize().insert_header(...)` or response builders to set `text/html`, strictly encode all user input using an HTML escaping library to prevent XSS.

```rust
use actix_web::{web, Responder, http::header};
use html_escape::encode_text;

async fn user_profile(username: web::Path<String>) -> impl Responder {
    let safe_name = encode_text(&username);
    let html_body = format!("<h1>User Profile</h1><p>Welcome, {}</p>", safe_name);

    html_body
        .customize()
        .insert_header((header::CONTENT_TYPE, "text/html; charset=utf-8"))
}
```


## Category: resource exhaustion

### Configure HTTP Server and Protocol Timeouts

**Use when**

Configuring transport protocols, server instances, client connections, and request timeouts to protect against slowloris and resource exhaustion attacks.

**Secure rules**

**Rule 1: Set explicit request and connection timeouts on the HTTP server to prevent slow client exhaustion.**

Configure `client_request_timeout`, `tls_handshake_timeout`, and `keep_alive` on `HttpServer` using `Duration` parameters to ensure that incomplete requests or slow handshakes are forcefully terminated. Avoid zero or unbounded configurations.

```rust
use std::time::Duration;
use actix_web::{App, HttpServer};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| App::new())
        .client_request_timeout(Duration::from_secs(5))
        .tls_handshake_timeout(Duration::from_secs(3))
        .bind(("127.0.0.1", 8080))?
        .run()
        .await
}
```

**Rule 2: Enforce connection limits and handshake rates to protect CPU and socket resources.**

Configure `max_connections` and `max_connection_rate` on `HttpServer` to bound active workloads and mitigate CPU resource exhaustion from TLS handshake bursts.

```rust
use actix_web::{App, HttpServer};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| App::new())
        .max_connections(10000)
        .max_connection_rate(128)
        .bind(("0.0.0.0", 8080))?
        .run()
        .await
}
```

**Rule 3: Configure explicit TLS handshake timeouts on transport acceptors.**

When initializing TLS service acceptors, configure an explicit handshake timeout using `TlsAcceptorConfig::handshake_timeout` to prevent unauthenticated clients from stalling connections.

```rust
use std::time::Duration;
use actix_http::{HttpService, TlsAcceptorConfig};

HttpService::build()
    .finish(handler)
    .rustls_0_23_with_config(
        tls_config,
        TlsAcceptorConfig::default().handshake_timeout(Duration::from_secs(5)),
    );
```


### Configure Outbound Client and Worker Operation Timeouts

**Use when**

Making outbound HTTP requests, configuring client connectors, or executing blocking tasks to prevent thread starvation and hung operations.

**Secure rules**

**Rule 1: Configure explicit timeouts and connection limits on HTTP client connectors.**

Use `awc::Connector` to configure explicit request timeouts, handshake timeouts, and active connection limits to prevent socket starvation and thread hanging.

```rust
use std::time::Duration;
use awc::Connector;

let connector = Connector::new()
    .timeout(Duration::from_secs(5))
    .handshake_timeout(Duration::from_secs(5))
    .limit(100)
    .finish();
```

**Rule 2: Offload synchronous or blocking computations using block tasks.**

Offload CPU-intensive calculations or blocking disk/database operations using `web::block` to prevent blocking the asynchronous event loop worker threads.

```rust
use actix_web::{web, HttpResponse, Error};

async fn sync_handler() -> Result<HttpResponse, Error> {
    let result = web::block(|| {
        std::thread::sleep(std::time::Duration::from_millis(100));
        "done"
    }).await.map_err(|_| actix_web::error::ErrorInternalServerError("Blocking task failed"))?;

    Ok(HttpResponse::Ok().body(result))
}
```


### Limit Payload Sizes and WebSocket Frames

**Use when**

Handling incoming request bodies, multipart form uploads, and WebSocket frame streaming to bound memory consumption.

**Secure rules**

**Rule 1: Enforce payload size limits for application requests and compressed bodies.**

Attach `web::PayloadConfig` using `app_data` on resources or routes to explicitly restrict the maximum allowed size in bytes for incoming request bodies.

```rust
use actix_web::{web, App, HttpResponse};

let app = App::new()
    .service(
        web::resource("/api/upload")
            .app_data(web::PayloadConfig::new(320_000))
            .route(web::post().to(|body: web::Bytes| async move {
                HttpResponse::Ok().body("Processing payload")
            }))
    );
```

**Rule 2: Set maximum frame size limits on WebSocket connections.**

Configure `max_frame_size` or use `WsResponseBuilder::frame_size` to reject oversized WebSocket frames and protect against memory exhaustion.

```rust
use actix_web::{get, web, Error, HttpRequest, HttpResponse};
use actix_web_actors::ws;

const MAX_FRAME_SIZE: usize = 16_384;

#[get("/ws")]
async fn websocket(req: HttpRequest, stream: web::Payload) -> Result<HttpResponse, Error> {
    ws::WsResponseBuilder::new(MyWsActor, &req, stream)
        .frame_size(MAX_FRAME_SIZE)
        .start()
}
```

**Rule 3: Enforce strict size limits on multipart form fields and total uploads.**

Apply `#[multipart(limit = "...")]` byte limits to individual struct fields and register `MultipartFormConfig` with a bounded `total_limit` to prevent oversized file uploads from exhausting server resources.

```rust
#[derive(MultipartForm)]
struct UploadForm {
    #[multipart(limit = "100MB")]
    file: TempFile,
    json: MpJson<Metadata>,
}

App::new()
    .service(post_video)
    .app_data(MultipartFormConfig::default().total_limit(100 * 1024 * 1024))
```


## Category: runtime environment hardening

### Disable experimental features in production builds

**Use when**

Configuring crate dependencies and feature flags for production deployment

**Secure rules**

**Rule 1: Do not expose experimental-introspection reports in production because they can include sensitive configuration details**

Limit experimental-introspection to development or local diagnostic builds, or ensure its reports are not exposed in production.

```toml
[dev-dependencies]
actix-web = { version = "4.14.0", features = ["experimental-introspection"] }
```


## Category: secret handling

### Redact Sensitive Headers and Credentials from Logs and Debug Output

**Use when**

When logging HTTP requests, client requests, or WebSocket connections containing sensitive credentials, bearer tokens, cookies, or authorization headers in Actix-web and `awc` applications.

**Secure rules**

**Rule 1: Avoid formatting or printing raw request objects or using unsafe logger format strings that expose sensitive headers**

Do not invoke Debug formatting on ClientRequest or WebsocketsRequest instances when they contain credentials or authorization headers, as this outputs raw sensitive tokens into log files. HttpRequest redacts Authorization, Proxy-Authorization, and Cookie header values, but prints other headers and the query string. Similarly, avoid configuring `Logger` format strings to directly print sensitive request headers or environment secrets, and use `custom_request_replace` to sanitize log output instead.

```rust
use actix_web::middleware::Logger;

let logger = Logger::new("%a \"%r\" %s %{AUTH_STATUS}xi")
    .custom_request_replace("AUTH_STATUS", |req| {
        if req.headers().contains_key("Authorization") {
            "present".to_string()
        } else {
            "missing".to_string()
        }
    });
```


## Category: security control integrity

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


## Category: session management

### Invalidate Client-Side Sessions Safely with add_removal_cookie

**Use when**

Clearing session cookies or authentication state from the client browser during logout or session termination

**Secure rules**

**Rule 1: Use add_removal_cookie instead of del_cookie to properly invalidate stored cookies on the client browser.**

When logging a user out or clearing session tokens, calling `del_cookie` only removes `Set-Cookie` headers from the in-memory response struct without instructing the browser to clear stored cookies. To ensure the client browser deletes the session cookie, construct a cookie with matching path and domain attributes and invoke `add_removal_cookie`.

```rust
use actix_web::HttpResponse;
use cookie::Cookie;

let mut res = HttpResponse::Ok().finish();
let cookie = Cookie::build("session_id", "")
    .path("/")
    .finish();
res.add_removal_cookie(&cookie).expect("valid header value");
```
