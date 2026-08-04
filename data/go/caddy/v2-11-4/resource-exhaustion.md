# Security cards

Repository: `https://github.com/caddyserver/caddy#v2.11.4`
Category: resource exhaustion

## resource exhaustion

### Enforce Memory and Buffer Limits on HTTP Requests, Responses, and File Browsing

**Use when**

Use when configuring Caddy servers, reverse proxies, and file servers to handle incoming client traffic and backend payloads securely without exhausting memory resources.

**Secure rules**

**Rule 1: Set explicit positive bounds on request and response buffer sizes in reverse proxy configurations.**

Avoid setting `request_buffers` or `response_buffers` to `-1` or unconstrained values. Always specify positive byte limits to prevent malicious clients or upstreams from consuming excessive memory during payload handling.

```json
{
  "handler": "reverse_proxy",
  "request_buffers": 10485760,
  "response_buffers": 10485760
}
```

**Rule 2: Limit the maximum number of entries returned during directory browsing.**

Explicitly configure `file_limit` in the file server `browse` configuration to cap the maximum number of directory entries loaded and rendered in memory per request, avoiding resource exhaustion from vast directory structures.

```json
{
  "handler": "file_server",
  "browse": {
    "file_limit": 500
  }
}
```

**Rule 3: Configure explicit timeouts and header size limits on HTTP servers.**

Set explicit `read_timeout`, `read_header_timeout`, and `idle_timeout` values on server configurations, and retain or define `max_header_bytes` to bound memory consumption and prevent slowloris connection exhaustion attacks.

```json
{
  "apps": {
    "http": {
      "servers": {
        "srv0": {
          "listen": [":443"],
          "read_header_timeout": "30s",
          "read_timeout": "1m",
          "idle_timeout": "2m"
        }
      }
    }
  }
}
```
