# Security cards

Repository: `https://github.com/salvo-rs/salvo#v0.94.0`
Category: interface protocol hardening

## interface protocol hardening

### Configure Protocol Versions and Timeouts to Prevent Protocol Abuse

**Use when**

Configuring network connection settings, transport negotiation protocols, and request timeouts in Salvo applications.

**Secure rules**

**Rule 1: Restrict transport negotiation to explicit, secure ALPN protocols instead of relying on default fallbacks.**

Call `.alpn_protocols()` on your configuration object to explicitly restrict negotiation to a specific subset of protocols, such as HTTP/2 only, preventing unencrypted or outdated protocol fallbacks.

```rust
let openssl_config = OpensslConfig::new(keycert)
    .alpn_protocols(vec![b"\x02h2".to_vec()]);
```

**Rule 2: Manage HTTP/1 header timeouts using server fuse policies rather than lower-level protocol builder settings.**

Configure header and connection timeouts via `FuseConfig` to properly handle slow client connections and prevent hangs during initial protocol detection.

```rust
use salvo_core::prelude::*;
use salvo_core::fuse::FuseConfig;

#[tokio::main]
async fn main() {
    let acceptor = TcpListener::new("127.0.0.1:8698").bind().await;

    let server = Server::new(acceptor).fuse_config(FuseConfig::default());
    server.serve(Router::new()).await;
}
```
