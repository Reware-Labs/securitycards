# Security cards

Repository: `https://github.com/actix/actix-web#web-v4.14.0`
Category: network boundary

## network boundary

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
