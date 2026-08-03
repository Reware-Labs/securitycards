# Security cards

Repository: `https://github.com/actix/actix-web#web-v4.14.0`
Category: interface protocol hardening

## interface protocol hardening

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
