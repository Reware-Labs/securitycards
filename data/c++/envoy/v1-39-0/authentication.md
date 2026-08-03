# Security cards

Repository: `https://github.com/envoyproxy/envoy#v1.39.0`
Category: authentication

## authentication

### Configure Complete Token Secrets and Client Authentication for OAuth2 Filters

**Use when**

Setting up Envoy OAuth2 authentication filters and client credentials for token exchange.

**Secure rules**

**Rule 1: Provide valid token secrets and assertion lifetimes for non-TLS client authentication modes.**

Ensure a valid `token_secret` is configured when `auth_type` is not `TLS_CLIENT_AUTH`, and explicitly configure a positive `assertion_lifetime` when using `PRIVATE_KEY_JWT`.

```yaml
config:
  auth_type: "PRIVATE_KEY_JWT"
  credentials:
    client_id: "client-id"
    token_secret:
      name: token_secret_name
    hmac_secret:
      name: hmac_secret_name
  private_key_jwt_config:
    signing_algorithm: RS256
    assertion_lifetime: 120s
```

**Rule 2: Configure mTLS upstream transport sockets for token endpoints using TLS client authentication.**

Configure the cluster referenced by the `token_endpoint` with an `UpstreamTlsContext` containing client certificates and private keys when `auth_type` is set to `TLS_CLIENT_AUTH`.

```yaml
clusters:
- name: oauth
  connect_timeout: 5s
  type: LOGICAL_DNS
  lb_policy: ROUND_ROBIN
  load_assignment:
    cluster_name: oauth
    endpoints:
    - lb_endpoints:
      - endpoint:
          address:
            socket_address:
              address: auth.example.com
              port_value: 443
  transport_socket:
    name: envoy.transport_sockets.tls
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext
      sni: auth.example.com
```

**Rule 3: Select secure client authentication types to avoid transmitting static secrets.**

Choose `TLS_CLIENT_AUTH` or `PRIVATE_KEY_JWT` for token endpoint communication to avoid transmitting static client secrets in request bodies or headers.

```yaml
auth_type: TLS_CLIENT_AUTH
```


### Configure Upstream and Downstream Authentication Credentials for Proxies

**Use when**

Deploying protocol filters and credential injectors that require authentication credentials.

**Secure rules**

**Rule 1: Enforce authentication controls for Redis proxy filters.**

Configure downstream authentication passwords and upstream cluster credentials using `RedisProtocolOptions` to prevent unauthorized command execution against backend clusters.

```yaml
filter_chains:
- filters:
  - name: redis
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.network.redis_proxy.v3.RedisProxy
      stat_prefix: redis_stats
      downstream_auth_passwords:
      - inline_string: "secure_downstream_password"
      prefix_routes:
        catch_all_route:
          cluster: cluster_0
clusters:
- name: cluster_0
  typed_extension_protocol_options:
    envoy.filters.network.redis_proxy:
      "@type": type.googleapis.com/envoy.extensions.filters.network.redis_proxy.v3.RedisProtocolOptions
      auth_password: { inline_string: "secure_upstream_password" }}
```

**Rule 2: Configure overwrite behavior explicitly in credential injector filters.**

Set the `overwrite` parameter in the `credential_injector` filter explicitly to control whether downstream client credentials take precedence or are overridden by injected tokens.

```yaml
name: envoy.filters.http.credential_injector
typed_config:
  "@type": type.googleapis.com/envoy.extensions.filters.http.credential_injector.v3.CredentialInjector
  overwrite: true
  credential:
    name: envoy.http.injected_credentials.oauth2
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.http.injected_credentials.oauth2.v3.OAuth2
      token_endpoint:
        cluster: oauth
        timeout: 3s
        uri: "oauth.com/token"
      client_credentials:
        client_id: test_client_id
        client_secret:
          name: client-secret
```

**Rule 3: Configure GCP authentication filter metadata on upstream clusters.**

Specify the GCP Authn Audience typed filter metadata with a valid service target URL on upstream clusters to ensure identity tokens are correctly requested.

```yaml
clusters:
- name: destination_cluster
  typed_filter_metadata:
    envoy.filters.http.gcp_authn:
      "@type": type.googleapis.com/envoy.extensions.filters.http.gcp_authn.v3.Audience
      url: "http://test.com"
```


### Enforce Audience and Issuer Validation in JWT Configuration

**Use when**

Configuring the JWT authentication filter to verify identity tokens and prevent confused deputy attacks.

**Secure rules**

**Rule 1: Explicitly configure allowed audiences in every JwtProvider configuration.**

Specify the allowed audiences using the `audiences` field in the `JwtProvider` configuration to ensure Envoy rejects tokens issued for different applications.

```yaml
providers:
  secure_provider:
    issuer: https://auth.example.com
    audiences:
    - my-target-api
    - https://api.example.com
    local_jwks:
      inline_string: "{...}"
```

**Rule 2: Explicitly specify the issuer field for all JwtProvider configurations.**

Always set the `issuer` field in the `JwtProvider` configuration to prevent Envoy from treating the provider as permissive and accepting tokens from untrusted issuers.

```yaml
providers:
  provider1:
    issuer: https://auth.example.com
    from_headers:
      - name: Authorization
        value_prefix: "Bearer "
```

**Rule 3: Explicitly define JWT extraction locations to prevent token exposure.**

Declare extraction locations such as `from_headers` explicitly in the `JwtProvider` configuration to disable insecure query parameter extraction and prevent credential logging.

```yaml
providers:
  provider_name:
    issuer: https://example.com
    from_headers:
      - name: Authorization
        value_prefix: "Bearer "
```


### Enforce Strict Certificate Validation and Revocation Controls

**Use when**

Use when configuring downstream and upstream TLS validation contexts, SNI matching, key usage requirements, and revocation checking in Envoy.

**Secure rules**

**Rule 1: Enforce subject alternative name matchers and trusted CAs for TLS server verification.**

Configure `match_typed_subject_alt_names` alongside `trusted_ca` within `CertificateValidationContext` to ensure complete server identity verification and prevent man-in-the-middle acceptance of unauthorized certificates.

```yaml
validation_context:
  trusted_ca:
    filename: /etc/ssl/certs/ca-certificates.crt
  match_typed_subject_alt_names:
  - san_type: DNS
    matcher:
      exact: foo.example.com
```

**Rule 2: Configure OCSP stapling and policy enforcement for downstream TLS certificates.**

Supply valid OCSP response staple files via `ocsp_staple` in `DownstreamTlsContext` and configure `ocsp_staple_policy` to `MUST_STAPLE` to ensure clients verify certificate revocation status without fallback risks.

```yaml
common_tls_context:
  tls_certificates:
    - certificate_chain:
        filename: "/etc/envoy/certs/servercert.pem"
      private_key:
        filename: "/etc/envoy/certs/serverkey.pem"
      ocsp_staple:
        filename: "/etc/envoy/certs/servercert.ocsp"
```

**Rule 3: Ensure certificate X.509 key usage extension compliance.**

Configure automated PKI tools to issue certificates with standard `keyUsage` extensions. In Envoy version 1.39.0, keyUsage extension enforcement is unconditionally enabled and the legacy `enforce_rsa_key_usage` option is deprecated and ignored.


### Establish Upstream Destination Trust with Trusted CAs, SANs, and Certificate Revocation

**Use when**

Configuring Envoy upstream TLS contexts or dynamic Secret Discovery Service (SDS) connections to connect to upstream destination servers securely.

**Secure rules**

**Rule 1: Configure UpstreamTlsContext validation contexts with trusted CA certificates, CRL paths, and explicit SAN matching or auto-validation.**

When establishing secure connections with upstream destinations, define a `validation_context` in `UpstreamTlsContext` containing both `trusted_ca` and `crl` configurations. Additionally, enforce Subject Alternative Name verification using `match_typed_subject_alt_names`, `auto_sni_san_validation`, or `auto_san_validation` to prevent upstream impersonation and Man-in-the-Middle attacks.

```yaml
transport_socket:
  name: envoy.transport_sockets.tls
  typed_config:
    "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext
    auto_sni_san_validation: true
    common_tls_context:
      validation_context:
        trusted_ca:
          filename: /etc/ssl/certs/ca-certificates.crt
        crl:
          filename: "/etc/envoy/certs/upstream_ca.crl"
        match_typed_subject_alt_names:
        - san_type: DNS
          matcher:
            exact: "upstream.service.internal"
```


### Secure and Isolate Redis Database Transactions and Connection Pools

**Use when**

Configuring Redis connection pools, managing transaction clients, and routing database transactions in Envoy.

**Secure rules**

**Rule 1: Isolate and explicitly terminate dedicated Redis database transaction clients**

When executing Redis database transactions using Envoy's Redis Transaction and Client interfaces, ensure dedicated upstream transaction connections are isolated per session and explicitly terminated via `Transaction::close()` upon transaction completion or network failure. Upstream transaction clients created with `is_transaction_client` set to `true` must not be returned to shared client pools while a transaction block is active, and transaction keys (`key_`) must strictly bind transaction commands to the corresponding cluster hash slot.

```cpp
Envoy::Extensions::NetworkFilters::Common::Redis::Client::Transaction txn(&connection_callbacks);
txn.start();
txn.key_ = "user_session_slot_key";

auto txn_client = client_factory->create(
    host, dispatcher, config, command_stats, scope,
    auth_user, auth_pass, /*is_transaction_client=*/true,
    aws_iam_config, aws_iam_authenticator);

txn.clients_.push_back(std::move(txn_client));
txn.close();
```

**Rule 2: Authenticate Redis connection pool sessions using database credentials**

When instantiating Redis database connection pools, always ensure connection creation passes authentication credentials, including both username and password, to the client factory. Propagating database credentials ensures all pooled upstream connections are properly authenticated before accepting and executing proxy requests.

```cpp
conn_pool_impl->tls_->getTyped<InstanceImpl::ThreadLocalPool>().auth_username_ = username;
conn_pool_impl->tls_->getTyped<InstanceImpl::ThreadLocalPool>().auth_password_ = password;
```

**Rule 3: Enforce read policies to control database query routing**

Configure explicit database read policies such as `MASTER` or `REPLICA` on Redis connection pool settings. The connection pool relies on these read policies within the load balancer context to safely separate master node operations from read-only replica operations.

```cpp
auto settings = Common::Redis::Client::createConnPoolSettings(
    20,
    true,
    true,
    max_unknown_conns,
    envoy::extensions::filters::network::redis_proxy::v3::RedisProxy::ConnPoolSettings::MASTER,
    redis_cx_rate_limit_per_sec);
```

**Rule 4: Enforce Primary Host Selection for Active Redis Transactions**

When routing commands through the Redis proxy connection pool, ensure that active database transactions strictly route to primary cluster nodes. The connection pool dynamically evaluates transaction state (`transaction.active_`) during request creation, switching read policy to `ReadPolicy::Primary` for both key-based and shard-based requests to preserve database transaction isolation and consistency boundaries.

```cpp
Common::Redis::Client::Transaction transaction;
transaction.active_ = true;
pool->makeRequest(key, std::move(request), callbacks, transaction);
```

**Rule 5: Maintain Redis Transaction Context Across Upstream Connections**

When forwarding Redis database commands through a proxy command splitter, active transaction context (`Common::Redis::Client::Transaction`) must be preserved across upstream client pool requests and explicitly updated before initiating primary or mirrored requests. Developers must ensure that `current_client_idx_` is explicitly reset to index `0` for the primary cluster client and incremented for secondary mirror connections so that transaction state and command execution boundaries remain isolated and bound to the correct connection.

```cpp
transaction.current_client_idx_ = 0;
auto handler = route->upstream(command)->makeRequest(key, ConnPool::RespVariant(incoming_request), callbacks, transaction);
if (handler) {
  for (auto& mirror_policy : route->mirrorPolicies()) {
    transaction.current_client_idx_++;
    if (mirror_policy->shouldMirror(command)) {
      mirror_policy->upstream()->makeRequest(key, ConnPool::RespVariant(incoming_request), null_pool_callbacks, transaction);
    }
  }
}
```
