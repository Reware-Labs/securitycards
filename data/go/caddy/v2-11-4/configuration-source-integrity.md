# Security cards

Repository: `https://github.com/caddyserver/caddy#v2.11.4`
Category: configuration source integrity

## configuration source integrity

### Enforce secure HTTPS and authentication for remote configuration and certificate loaders

**Use when**

When loading dynamic Caddy configurations or root CA certificates over the network using remote endpoints.

**Secure rules**

**Rule 1: Always use HTTPS endpoints and explicit TLS client/CA credentials when retrieving remote server configurations or dynamic CA certificates.**

Prevent network attackers from altering configuration settings or injecting malicious root certificates by using secure `https://` URLs and configuring TLS settings, such as `RootCAPEMFiles`, `ClientCertificateFile`, and `ClientCertificateKeyFile`, instead of unencrypted plain HTTP.

```go
loader := caddyconfig.HTTPLoader{
    Method: "GET",
    URL: "https://config-server.internal.domain/v1/caddy-config",
    Timeout: caddy.Duration(10 * time.Second),
    TLS: &struct {
        UseServerIdentity bool `json:"use_server_identity,omitempty"`
        ClientCertificateFile string `json:"client_certificate_file,omitempty"`
        ClientCertificateKeyFile string `json:"client_certificate_key_file,omitempty"`
        RootCAPEMFiles []string `json:"root_ca_pem_files,omitempty"`
    }{
        RootCAPEMFiles: []string{"/etc/ssl/certs/internal-ca.pem"},
        ClientCertificateFile: "/etc/ssl/certs/config-client.crt",
        ClientCertificateKeyFile: "/etc/ssl/certs/config-client.key",
    },
}
```
