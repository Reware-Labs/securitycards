# Security cards

Repository: `https://github.com/caddyserver/caddy#v2.11.4`
Category: network boundary

## network boundary

### Restrict network boundaries and proxy listener access

**Use when**

Configuring network interfaces, proxy binding, and trusted client IP ranges across trust boundaries in Caddy.

**Secure rules**

**Rule 1: Configure Caddy's admin endpoint listener to bind strictly to loopback interfaces or Unix domain sockets.**

Explicitly define the admin listener address to a restricted loopback address or Unix socket to prevent exposing the unauthenticated control interface to public networks.

```json
{
  "admin": {
    "listen": "127.0.0.1:2019",
    "enforce_origin": true
  }
}
```

**Rule 2: Configure trusted proxy IP ranges when evaluating client IP addresses and headers.**

Specify explicit upstream proxy IP ranges using `trusted_proxies` and enable strict right-to-left header evaluation to prevent header spoofing and unauthorized IP manipulation.

```json
{
    servers {
        trusted_proxies static 10.0.1.0/24
    }
}
```
