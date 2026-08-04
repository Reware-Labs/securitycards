# Security cards

Repository: `https://github.com/actix/actix-web#web-v4.14.0`
Category: resource exhaustion

## resource exhaustion

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
