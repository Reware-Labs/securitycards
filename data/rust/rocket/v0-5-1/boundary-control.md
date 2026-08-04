# Security cards

Repository: `https://github.com/rwf2/Rocket#v0.5.1`
Category: boundary control

## boundary control

### Disable client IP header inspection when untrusted

**Use when**

Configuring Rocket applications that are directly internet-facing and not behind a trusted reverse proxy.

**Secure rules**

**Rule 1: Set ip_header = false unless Rocket is reachable only through a trusted reverse proxy that overwrites the configured client-IP header**

By default, Request::real_ip() reads X-Real-IP, and Request::client_ip() prefers it over the connection peer address. Keep this enabled only when Rocket cannot be reached directly and the trusted proxy removes or overwrites incoming X-Real-IP headers; otherwise, attackers can spoof the IP observed by application controls and rate limiters.

```toml
[release]
ip_header = false
```
