# Security cards

Repository: `https://github.com/traefik/traefik#v3.7.10`
Category: input interpretation safety

## input interpretation safety

### Enable Path Sanitization on EntryPoints to Prevent Traversal Attacks

**Use when**

Configuring HTTP entrypoints to protect static file servers and downstream backends from relative directory traversal attempts.

**Secure rules**

**Rule 1: Enforce `sanitizePath: true` under the HTTP configuration of all entryPoints.**

Traefik normalizes request paths by removing duplicate slashes and resolving dot segments like `..` and `.` before forwarding requests. Ensure path sanitization is explicitly enabled on entrypoints to neutralize relative directory traversal attempts.

```yaml
entryPoints:
  websecure:
    address: ":443"
    http:
      sanitizePath: true
```


### Restrict Encoded Path Characters to Prevent Parsing Discrepancies and Bypasses

**Use when**

Configuring Traefik router paths and handling URL-encoded request characters to ensure consistent path interpretation between proxies and upstream services.

**Secure rules**

**Rule 1: Restrict encoded path characters in router rules to prevent path normalization discrepancies**

Keep flags such as `allowEncodedSlash`, `allowEncodedBackSlash`, and `allowEncodedNullCharacter` set to false in an `encodedCharacters` middleware attached to the router unless an upstream service explicitly requires them and has strict path handling controls in place.

```yaml
http:
  middlewares:
    reject-encoded-characters:
      encodedCharacters:
        allowEncodedSlash: false
        allowEncodedBackSlash: false
        allowEncodedNullCharacter: false
  routers:
    secure-router:
      rule: "Host(`app.example.com`) && PathPrefix(`/api`)"
      middlewares:
        - reject-encoded-characters
      service: "api-service"
```
