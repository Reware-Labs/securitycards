# Security cards

Repository: `https://github.com/caddyserver/caddy#v2.11.4`
Category: access control

## access control

### Configure Explicit Access Control and Boundary Rules for Caddy Endpoints and Services

**Use when**

When defining server listeners, routing policies, forwarding authentication headers, and administrative API access boundaries to enforce authorization constraints.

**Secure rules**

**Rule 1: Enforce explicit route path segment boundaries and origin checks when configuring remote administrative permissions and local admin API access.**

When configuring `RemoteAdmin` permissions using `AdminAccess` rules, Caddy enforces path prefix checks strictly at path segment boundaries. Ensure path permissions rely on path-segment boundaries to restrict access to sensitive routes. Additionally, set `enforce_origin: true` and specify explicit allowed origins in `origins` on `admin` configuration to prevent cross-site requests or unauthorized configuration modifications.

```json
{
  "admin": {
    "listen": "localhost:2019",
    "enforce_origin": true,
    "origins": [
      "localhost:2019",
      "127.0.0.1:2019"
    ]
  }
}
```

**Rule 2: Restrict client-supplied identity headers and enforce default-deny policies for certificate issuance and proxy forwarding.**

When using `forward_auth` with `copy_headers`, rely on the directive to automatically strip client-supplied request headers matching `copy_headers` before proxying requests, preventing attackers from injecting arbitrary identity or role values. Furthermore, explicitly define `allow` rule sets for trusted domain names and IP ranges when configuring the ACME server certificate issuance policy to enforce default-deny behavior.

```json
{
  "allow": {
    "domains": ["internal.example.com"],
    "ip_ranges": ["10.0.0.0/8"]
  },
  "allow_wildcard_names": false
}
```

**Rule 3: Restrict Unix domain socket permissions using explicit octal mode bits.**

When configuring Unix domain socket addresses for Caddy listeners, append octal file mode bits using the pipe syntax to ensure that owner write permission bits are present and unauthorized local processes are prevented from interacting with socket listeners.

```json
{
  "apps": {
    "http": {
      "servers": {
        "internal": {
          "listen": ["unix//var/run/app.sock|0660"]
        }
      }
    }
  }
}
```
