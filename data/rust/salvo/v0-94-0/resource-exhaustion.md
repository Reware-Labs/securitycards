# Security cards

Repository: `https://github.com/salvo-rs/salvo#v0.94.0`
Category: resource exhaustion

## resource exhaustion

### Configure Request Body and Path Parameter Limits

**Use when**

When defining routes and handling incoming requests in Salvo to prevent resource exhaustion from large payloads or unbounded path parameters.

**Secure rules**

**Rule 1: Restrict large payloads using route-specific body size limits rather than expanding global settings.**

Keep the global default request body size at its secure value and register the `SecureMaxSize` middleware only on specific routers or routes that require handling larger payloads.

```rust
use salvo::prelude::*;
use salvo::http::SecureMaxSize;

#[handler]
async fn upload_handler(req: &mut Request) {}

let router = Router::with_path("/upload")
    .hoop(SecureMaxSize::new(10 * 1024 * 1024))
    .post(upload_handler);
```

**Rule 2: Apply explicit length constraints on character-based path parameters.**

When configuring path parameters using wisps like `CharsWispBuilder`, specify an explicit min and max range to prevent dynamic heap allocation issues from malicious inputs.

```rust
use salvo::prelude::*;

let router = Router::with_path("users/{id:num(1..=12)}");
```


### Limit Concurrent Connections and Request Timeouts

**Use when**

When initializing server acceptors and configuring timeout behaviors to protect against slow HTTP and connection exhaustion attacks.

**Secure rules**

**Rule 1: Configure maximum concurrent connections on the server.**

Apply the `max_connections` method during server initialization to limit active concurrent connections and defend against denial-of-service attacks.

```rust
use salvo_core::prelude::*;

#[tokio::main]
async fn main() {
    let acceptor = TcpListener::new("127.0.0.1:8698").bind().await;
    let server = Server::new(acceptor).max_connections(1000);
    server.serve(Router::new()).await;
}
```

**Rule 2: Configure strict timeouts for standard REST or JSON APIs.**

Opt for `FuseConfig::strict()` or explicitly configure idle, write-stall, and request body timeouts when serving applications that do not require long-lived streaming.

```rust
use std::time::Duration;
use salvo_core::fuse::FuseConfig;

let config = FuseConfig::strict();

let hardened_config = FuseConfig::default()
    .with_connection_idle_timeout(Duration::from_secs(60))
    .with_write_stall_timeout(Duration::from_secs(30))
    .with_request_body_timeout(Duration::from_secs(45));
```
