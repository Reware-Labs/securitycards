# Security cards

Repository: `https://github.com/rwf2/Rocket#v0.5.1`
Category: network boundary

## network boundary

### Configure trusted reverse proxy headers for client IP determination

**Use when**

When deploying a Rocket application behind a reverse proxy or load balancer and handling client IP addresses for network boundary enforcement.

**Secure rules**

**Rule 1: Ensure upstream reverse proxies sanitize incoming client-supplied IP headers to prevent IP spoofing.**

Because `Request::client_ip()` and `Request::real_ip()` rely on HTTP headers such as `ip_header`, an attacker can forge these headers if the application is directly exposed or if the upstream proxy fails to strip incoming values. Configure your upstream reverse proxy to strip incoming client-supplied headers and ensure trusted proxy boundaries are maintained.

```rust
#[get("/")]
fn index(client_ip: Option<std::net::IpAddr>) {
    if let Some(ip) = client_ip {
        // Handled IP derived from configured ip_header or remote socket fallback
    }
}
```
