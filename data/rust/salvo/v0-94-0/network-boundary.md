# Security cards

Repository: `https://github.com/salvo-rs/salvo#v0.94.0`
Category: network boundary

## network boundary

### Configure Trusted Proxy Identifiers to Prevent Client IP Spoofing

**Use when**

Configuring rate-limiting, proxy routing, or client origin identification behind network load balancers or reverse proxies where incoming request headers can be manipulated.

**Secure rules**

**Rule 1: Use TrustedProxyIssuer with explicitly defined proxy IP addresses instead of unconditionally trusting client-controlled forwarding headers.**

Initialize the `TrustedProxyIssuer` with a verified list of your proxy IPs to securely identify clients while avoiding header-spoofing attacks that bypass rate limits.

```rust
use std::net::IpAddr;
use salvo_rate_limiter::{RateLimiter, TrustedProxyIssuer, BasicQuota, FixedGuard, MokaStore};

let trusted_proxies = [
    "10.0.0.5".parse::<IpAddr>().unwrap(),
    "10.0.0.6".parse::<IpAddr>().unwrap(),
];

let limiter = RateLimiter::new(
    FixedGuard::default(),
    MokaStore::default(),
    TrustedProxyIssuer::new(trusted_proxies),
    BasicQuota::per_minute(100),
);
```
