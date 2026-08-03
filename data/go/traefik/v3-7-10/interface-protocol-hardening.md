# Security cards

Repository: `https://github.com/traefik/traefik#v3.7.10`
Category: interface protocol hardening

## interface protocol hardening

### Configure Automatic HTTP to HTTPS EntryPoint and Service Redirections

**Use when**

Setting up entryPoints or dynamic routing configurations where unencrypted traffic must be automatically redirected to secure HTTPS endpoints.

**Secure rules**

**Rule 1: Enforce automatic protocol upgrading by configuring entryPoint-level or middleware-based HTTP to HTTPS redirections**

In your Traefik static configuration, set `http.redirections.entryPoint.to` on unencrypted entryPoints like port `80` to point to a TLS-enabled entryPoint with `scheme: https` and `permanent: true`. For dynamic providers like Consul Catalog or Nomad, attach a `redirectscheme` middleware configured with `scheme=https` to your HTTP routers using service tags to redirect clients to HTTPS after the initial plaintext request.

```yaml
entryPoints:
  web:
    address: :80
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
          permanent: true
  websecure:
    address: :443
    http:
      tls: {}
```


### Enforce Strict Protocol and Header Validation on EntryPoints

**Use when**

Configuring entrypoints and routing rules to prevent request smuggling, header pollution, and protocol confusion attacks.

**Secure rules**

**Rule 1: Configure the underscore headers strategy to delete or reject ambiguous headers.**

Set `underscoreHeadersStrategy` to `delete` or `reject` on entrypoints rather than keeping the default `keep` setting to prevent header pollution and environment variable injection attacks against backend services.

```yaml
entryPoints:
  web:
    address: ":80"
    http:
      underscoreHeadersStrategy: "delete"
```

**Rule 2: Enable strict SNI checking to reject requests with invalid or missing server names.**

Configure `sniStrict: true` in TLS options so Traefik explicitly rejects connections from clients that do not supply a Server Name Indication header or attempt to connect to a domain that does not match any configured certificate.

```yaml
tls:
  options:
    default:
      sniStrict: true
```
