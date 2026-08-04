# Security cards

Repository: `https://github.com/envoyproxy/envoy#v1.39.0`
Category: secret handling

## secret handling

### Automate TLS Certificate Rotation and Secret Discovery

**Use when**

Use when configuring automated TLS certificate, validation context, and session ticket key lifecycles using dynamic Secret Discovery Service (SDS) providers or filesystem-backed watched directories in Envoy.

**Secure rules**

**Rule 1: Configure Envoy TLS contexts to load certificates dynamically via SDS configurations and watched directories.**

Use `tls_certificate_sds_secret_configs` or `validation_context_sds_secret_config` in `CommonTlsContext` to fetch dynamic certificates and CA trust bundles. When using filesystem-backed secrets, specify `watched_directory` on the parent path to watch for atomic symlink replacements and trigger clean reloads without process restarts.

```yaml
common_tls_context:
  tls_certificate_sds_secret_configs:
  - name: "server_cert_rsa"
    sds_config:
      resource_api_version: V3
      api_config_source:
        api_type: GRPC
        transport_api_version: V3
        grpc_services:
        - envoy_grpc:
            cluster_name: "sds_cluster"
```

**Rule 2: Secure the communication channel between Envoy proxy and SDS servers.**

Protect dynamic certificate channels by using local Unix Domain Sockets or remote TLS connections authenticated with mutual TLS or strict transport security credentials.

```yaml
clusters:
  - name: sds_server_uds
    connect_timeout: 0.25s
    type: STATIC
    load_assignment:
      cluster_name: sds_server_uds
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  pipe:
                    path: /tmp/uds_path
```

**Rule 3: Monitor SDS rotation failure metrics and register update callbacks for dynamic updates.**

Subscribe to dynamic secret updates using update callbacks such as `addUpdateCallback` and monitor counter metrics like `key_rotation_failed` to catch validation errors and prevent silent failures during automated certificate rotations.

```cpp
auto handle = sds_api->addUpdateCallback([this]() {
  return secret_callbacks_.onAddOrUpdateSecret();
});
```


### Load Dynamic Secrets Securely Using Secret Discovery Service

**Use when**

Configuring dynamic TLS certificates, session ticket keys, validation contexts, or generic authentication secrets in Envoy using the Secret Discovery Service (SDS).

**Secure rules**

**Rule 1: Use Secret Discovery Service (SDS) generic and TLS secret resources instead of hardcoding sensitive credentials in static configurations.**

Configure `token_secret` and `hmac_secret` references or transport socket TLS contexts using SDS and file-based or gRPC configuration sources to avoid embedding cleartext credentials in source code and configuration files.

```yaml
credentials:
  client_id: "your-oauth-client-id"
  token_secret:
    name: oauth_token_secret
    sds_config:
      path_config_source:
        path: "/etc/envoy/secrets/token_secret.yaml"
  hmac_secret:
    name: oauth_hmac_secret
    sds_config:
      path_config_source:
        path: "/etc/envoy/secrets/hmac_secret.yaml"
```

**Rule 2: Configure atomic directory-level renames or watched directories for file-backed SDS secrets.**

When using file-backed DataSources or SDS secrets, configure `watched_directory` on the secret proto and perform atomic symlink updates on the host to prevent partial reads and secret loading failures.

```yaml
tls_certificate:
  certificate_chain:
    filename: "/etc/certs/tls.crt"
  private_key:
    filename: "/etc/certs/tls.key"
  watched_directory:
    path: "/etc/certs"
```

**Rule 3: Assign unique static secret names within Envoy's SecretManager.**

Ensure that every static secret registered in Envoy's static resource configuration has a distinct `name` field to prevent static secret initialization failures and service disruption.

```yaml
static_resources:
  secrets:
  - name: "server_cert_v1"
    tls_certificate:
      certificate_chain: { filename: "/etc/envoy/certs/server.crt" }
      private_key: { filename: "/etc/envoy/certs/server.key" }
  - name: "client_ca_v1"
    validation_context:
      trusted_ca: { filename: "/etc/envoy/certs/ca.crt" }
```


### Secure Envoy Administrative Interfaces and Configuration Dumps

**Use when**

Configuring Envoy bootstrap parameters, setting up administrative endpoints, or managing diagnostic interfaces.

**Secure rules**

**Rule 1: Disable administrative server sockets in bootstrap configurations when administrative endpoints are not required.**

Explicitly clear the `admin` stanza in your `envoy::config::bootstrap::v3::Bootstrap` configuration to prevent opening administrative ports and exposing internal cluster state.

```cpp
envoy::config::bootstrap::v3::Bootstrap bootstrap;
// Explicitly remove admin server configuration to prevent opening administrative ports
bootstrap.clear_admin();
```

**Rule 2: Use strongly-typed configuration messages instead of untyped structs to ensure secrets are redacted in admin config dumps.**

Define extension configurations using `typed_config` with `google.protobuf.Any` rather than legacy untyped `google.protobuf.Struct` fields. Strongly-typed protobuf configs allow Envoy to automatically redact secret fields such as `private_key` and passwords when inspected via `/config_dump`.

```yaml
typed_config:
  "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.DownstreamTlsContext
  common_tls_context:
    tls_certificates:
    - certificate_chain:
        filename: "/etc/envoy/certs/server.crt"
      private_key:
        filename: "/etc/envoy/certs/server.key"
```


### Use Dynamic AWS Credential Providers and Redact Sensitive Tokens

**Use when**

Integrating AWS SigV4 request signing or STS credential retrieval providers within Envoy extensions and filters.

**Secure rules**

**Rule 1: Configure dynamic AWS credential providers instead of inline static keys.**

Use dynamic providers such as `assume_role_with_web_identity_provider` or IAM Roles Anywhere configuration rather than embedding long-lived static keys in Envoy configuration files.

```yaml
credential_provider:
  assume_role_with_web_identity_provider:
    web_identity_token_data_source:
      filename: "/var/run/secrets/tokens/aws-token"
    role_arn: "arn:aws:iam::123456789012:role/my-role"
```

**Rule 2: Redact sensitive tokens and signatures from log outputs.**

Ensure that sensitive values such as temporary access keys, security tokens, and signature strings are sanitized or overwritten with masks before emitting debug log messages.

```cpp
query_params.overwrite(SignatureQueryParameterValues::AmzSignature, "*****");
if (query_params.getFirstValue(SignatureQueryParameterValues::AmzSecurityToken)) {
  query_params.overwrite(SignatureQueryParameterValues::AmzSecurityToken, "*****");
}
```
