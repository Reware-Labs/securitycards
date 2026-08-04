# Security cards

Repository: `https://github.com/envoyproxy/envoy#v1.39.0`
Category: input interpretation safety

## input interpretation safety

### Enforce Strict Canonical Host and Authority Parsing

**Use when**

When configuring host matching, authority validation, or TLS SNI parameters for untrusted network endpoints.

**Secure rules**

**Rule 1: Specify IPv6 allowed domains without brackets for OAuth2 host matching**

Configure `allowed_domains` using domain names, wildcards, or bracketless IPv6 strings such as `::1` because Envoy's authority parser normalizes IPv6 hostnames by stripping surrounding brackets.

```yaml
allowed_domains:
  - "example.com"
  - "*.example.com"
  - "::1"
```

**Rule 2: Avoid null bytes in SNI configuration strings**

Sanitize and validate string inputs to ensure SNI hostnames do not contain embedded null bytes (`\000`) before assigning them to transport context settings.

```cpp
envoy::extensions::transport_sockets::tls::v3::UpstreamTlsContext tls_context;
if (sni_string.find('\0') == std::string::npos) {
  tls_context.set_sni(sni_string);
}
```


### Sanitize and Canonicalize Request Paths and Parameters to Prevent Bypass

**Use when**

When configuring routing rules, HTTP header validation, or query parameter parsing where untrusted input must be safely interpreted and normalized.

**Secure rules**

**Rule 1: Sanitize path matrix parameters during route matching**

Enable `ignore_path_parameters_in_path_matching` in routing configurations to ensure matrix parameters like `;param=value` are removed from the path prior to evaluation, preventing path-based security bypasses.

```yaml
virtual_hosts:
  - name: protected_service
    domains: ["*"]
    routes:
      - match:
          prefix: "/api/v1"
          ignore_path_parameters_in_path_matching: true
        route:
          cluster: service_backend
```

**Rule 2: Decode query parameters safely without unescaping control characters**

Use `parseAndDecodeQueryString` or `urlDecodeQueryParameter` to ensure percent-encoded sequences are appropriately handled and normalized before making security decisions or inspecting query keys and values.

```cpp
auto params = Envoy::Http::Utility::QueryParamsMulti::parseAndDecodeQueryString(request_path);
auto val = params.getFirstValue("name");
if (val.has_value()) {
  // Perform validation on decoded value
}
```

**Rule 3: Strip URI fragments from request path headers**

Configure `strip_fragment_from_path` in `HeaderValidatorConfig` to ensure URI fragments are safely removed from request paths before route matching and upstream delivery.

```yaml
header_validator_config:
  strip_fragment_from_path: true
```
