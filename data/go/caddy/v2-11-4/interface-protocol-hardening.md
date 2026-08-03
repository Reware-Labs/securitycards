# Security cards

Repository: `https://github.com/caddyserver/caddy#v2.11.4`
Category: interface protocol hardening

## interface protocol hardening

### Enforce Strict Protocol and Header Validation for Upstream Proxy Transport

**Use when**

When configuring reverse proxy transport layers and proxy protocol parameters to communicate with upstream servers.

**Secure rules**

**Rule 1: Configure reverse proxy transport to send PROXY protocol headers only to trusted upstream servers.**

When forwarding client requests to upstream backends that rely on client network context, set the `proxy_protocol` setting to `v1` or `v2` on the transport. Ensure that upstream services accept PROXY protocol headers exclusively from trusted proxies on controlled network segments.

```json
{
  "handler": "reverse_proxy",
  "upstreams": [{"dial": "127.0.0.1:8080"}],
  "transport": {
    "protocol": "http",
    "proxy_protocol": "v2",
    "versions": ["1.1"]
  }
}
```


### Restrict Non-Idempotent Requests During Early Data and Enforce Strict Framing

**Use when**

When configuring HTTP matching rules and transport settings to handle early data requests or protocol version restrictions safely.

**Secure rules**

**Rule 1: Restrict non-idempotent HTTP methods when processing uncompleted TLS handshakes or early data.**

When matching requests via `MatchTLS`, QUIC or TLS 1.3 0-RTT early data requests can be processed before handshakes are completed. Restrict non-idempotent HTTP methods by responding with status code `425` (Too Early) to mitigate replay attacks.

```json
{
  "match": [
    {
      "tls": {
        "handshake_complete": false
      },
      "method": ["POST", "PUT", "PATCH", "DELETE"]
    }
  ],
  "handle": [
    {
      "handler": "static_response",
      "status_code": 425
    }
  ]
}
```

**Rule 2: Configure HTTP/3 reverse proxy transport with exclusive version listing and explicit TLS configuration.**

When specifying HTTP/3 (`3`) in the reverse proxy transport versions array, ensure that TLS is enabled via a non-nil `tls` block and that `3` is the sole version listed in the versions slice.

```json
{
	"transport": {
		"protocol": "http",
		"versions": ["3"],
		"tls": {}
	}
}
```
