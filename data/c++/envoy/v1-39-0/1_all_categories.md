# Security cards

Repository: `https://github.com/envoyproxy/envoy#v1.39.0`

## Category: access control

### Configure strict CORS origin matching and enforcement

**Use when**

Configuring route-level or virtual host-level CORS policies in Envoy to manage cross-origin access and protect backend resources from unauthorized third-party requests.

**Secure rules**

**Rule 1: Use strict string matchers for allowed origins and ensure filtering is fully enabled in production environments.**

When instantiating `CorsPolicyImplBase` or configuring `Router::CorsPolicy`, ensure that `allow_origin_string_match` rules use explicit exact matchers instead of permissive patterns. Keep `filter_enabled` active at 100% in production so that CORS checks are fully enforced, and ensure that `forwardNotMatchingPreflights()` is set to false to block unverified cross-origin preflights from reaching upstream clusters.

```cpp
envoy::config::route::v3::CorsPolicy cors_config;
auto* origin_matcher = cors_config.add_allow_origin_string_match();
origin_matcher->set_exact("https://app.example.com");
cors_config.mutable_allow_credentials()->set_value(true);
cors_config.mutable_filter_enabled()->mutable_default_value()->set_numerator(100);
cors_config.mutable_filter_enabled()->mutable_default_value()->set_denominator(envoy::type::v3::FractionalPercent::HUNDRED);
```


### Enforce Role-Based Access Control and Authorization Policies

**Use when**

Configuring Envoy HTTP RBAC filters, destination port ranges, and authorization rules to restrict access and enforce access control policies.

**Secure rules**

**Rule 1: Enforce fine-grained access control using RBAC policies and CEL conditions**

Configure Envoy's HTTP RBAC filter using `HttpAttributesCelMatchInput` and explicit matchers to enforce access control rules and deny unauthorized requests.

```yaml
name: rbac
typed_config:
  "@type": type.googleapis.com/envoy.extensions.filters.http.rbac.v3.RBAC
  matcher:
    matcher_list:
      matchers:
        - predicate:
            single_predicate:
              input:
                name: envoy.matching.inputs.cel_data_input
                typed_config:
                  "@type": type.googleapis.com/xds.type.matcher.v3.HttpAttributesCelMatchInput
              custom_match:
                name: envoy.matching.matchers.cel_matcher
                typed_config:
                  "@type": type.googleapis.com/xds.type.matcher.v3.CelMatcher
                  expr_match:
                    parsed_expr:
                      expr:
                        call_expr:
                          function: _==_
                          args:
                          - select_expr:
                              operand:
                                ident_expr:
                                  name: request
                              field: path
                          - const_expr:
                              string_value: "/internal-admin"
          on_match:
            action:
              name: envoy.filters.rbac.action
              typed_config:
                "@type": type.googleapis.com/envoy.config.rbac.v3.Action
                name: deny-request
                action: DENY
```

**Rule 2: Ensure RBAC port ranges specify valid boundaries**

When configuring RBAC policies with port ranges, set valid boundaries where the start is strictly less than the end and within valid port limits to prevent initialization failures.

```cpp
envoy::config::rbac::v3::Permission permission;
auto* range = permission.mutable_destination_port_range();
range->set_start(80);
range->set_end(443);
```


### Secure Administrative API Endpoints and Restrict Network Exposure

**Use when**

Configuring, extending, or exposing Envoy administrative interface endpoints, handlers, and listeners.

**Secure rules**

**Rule 1: Explicitly mark state-modifying custom administrative handlers with mutates_server_state set to true.**

When registering custom administrative handlers using `AdminImpl::addHandler` or `AdminImpl::addStreamingHandler`, set the `mutates_server_state` parameter to `true` for any endpoint that modifies server state or configuration. This ensures the admin HTTP connection manager enforces that state-altering administrative operations require HTTP POST requests rather than HTTP GET.

```cpp
admin.addHandler("/custom_reconfig", "Reconfigures subsystem",
                 handler_callback, /*removable=*/false,
                 /*mutates_server_state=*/true);
```

**Rule 2: Restrict administrative HTTP listener addresses strictly to loopback interfaces or protected sockets.**

When starting the administrative HTTP listener via `startHttpListener`, ensure the network address passed in is bound strictly to a loopback IP (such as `127.0.0.1` or `::1`) or a protected Unix domain socket rather than a wildcard or public interface, preventing remote unauthenticated access.

```cpp
auto address = Network::Utility::parseInternetAddressAndPortNoThrow("127.0.0.1:9901");
admin->startHttpListener(access_logs, address, socket_options);
```

**Rule 3: Restrict administrative endpoint accessibility using path allowlists.**

Restrict administrative endpoint accessibility by populating target path matchers with `AdminImpl::addAllowlistedPath` and checking candidate paths via `acceptTargetPath` to prevent unauthorized exposure of configuration dumps, sensitive secrets, or profiling endpoints.

```cpp
auto matcher = std::make_unique<Matchers::ExactStringMatcher>("/stats");
admin_impl->addAllowlistedPath(std::move(matcher));

if (admin_impl->acceptTargetPath(request_path)) {
  // Process request
}
```


### Secure Envoy Management and Health Endpoints against Unauthorized Access and Mutation

**Use when**

Configuring, exposing, or extending Envoy management, administrative, and health-checking interfaces such as `/config_dump`, `/healthcheck/fail`, or custom admin handlers.

**Secure rules**

**Rule 1: Bind administrative listeners strictly to trusted local loopback interfaces or dedicated management networks and keep path normalization enabled.**

Ensure Envoy administration interfaces are never exposed to public or untrusted network interfaces to prevent internal network reconnaissance via `/config_dump` and sensitive configuration disclosures. Keep `shouldNormalizePath()` and `shouldMergeSlashes()` enabled on admin connection managers.

```yaml
admin:
  address:
    socket_address:
      address: 127.0.0.1
      port_value: 9901
```

**Rule 2: Enforce HTTP POST method and set mutates_server_state to true for administrative endpoints that alter server state.**

State-mutating administrative endpoints such as `/healthcheck/fail`, `/healthcheck/ok`, or custom mutating handlers registered via `addHandler()` must explicitly require HTTP POST semantics and set `mutates_server_state = true` to protect against accidental triggers or cross-site execution.

```cpp
admin.addHandler("/custom/status", "Get custom status", callback, true, false);
```

**Rule 3: Order non-terminal health check filters before terminal routing filters and revoke admin access early during shutdown.**

Position non-terminal management and health check filters before terminal filters in the `http_filters` configuration array. Additionally, invoke `shutdownAdmin()` early during the server shutdown sequence to immediately revoke administrative access before releasing server resources.

```yaml
http_filters:
- name: health_check
  typed_config:
    "@type": type.googleapis.com/envoy.extensions.filters.http.health_check.v3.HealthCheck
    pass_through_mode: false
- name: envoy.filters.http.router
  typed_config:
    "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
```


## Category: api contract misuse

### Avoid Conflicting Authorization Header Flags in OAuth2 Configuration

**Use when**

Configuring the OAuth2 HTTP filter in Envoy where multiple request header manipulation flags could be mistakenly enabled simultaneously.

**Secure rules**

**Rule 1: Select only one Authorization header handling flag per OAuth2 configuration to prevent conflicting management of request headers.**

Do not combine conflicting HTTP `Authorization` header manipulation flags in the OAuth2 filter. Enabling more than one of `forward_bearer_token`, `preserve_authorization_header`, or `forward_id_token` is disallowed because they attempt to manage the same request header and cause configuration rejection.

```yaml
config:
  forward_bearer_token: true
  preserve_authorization_header: false
  token_endpoint:
    cluster: oauth_cluster
    uri: oauth.com/token
    timeout: 3s
```


## Category: authentication

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


## Category: boundary control

### Restrict Envoy Dynamic Modules to Fully Trusted Code

**Use when**

When loading dynamic modules into Envoy that run in-process and share its full privilege level and memory space.

**Secure rules**

**Rule 1: Only load dynamic modules from fully trusted sources and verify ABI compatibility.**

Because dynamic modules run in-process with Envoy without security sandboxing, ensure that you only load binary modules compiled from trusted, code-reviewed source repositories and adhere strictly to memory ownership rules in `abi.h`.

```c
// Verify ABI compatibility and ensure pointers remain valid for their specified lifetime.
typedef const char* envoy_dynamic_module_type_abi_version_module_ptr;

// Module-owned buffers must remain allocated and unmodified for the lifetime expected
// by the specific event hook or callback.
```


## Category: configuration source integrity

### Use Trusted Local File Paths for Dynamic Module Certificate Validators

**Use when**

Configuring dynamic module TLS certificate validators or shared library paths where configuration source integrity must be maintained.

**Secure rules**

**Rule 1: Specify dynamic module source libraries using trusted local filesystem paths or registered module names.**

Ensure that dynamic module shared library paths reference local trusted files using `module.local.filename` or `dynamic_module_config.name`, as remote fetching of dynamic module shared libraries is unsupported and can lead to context creation errors or insecure module loading.

```yaml
typed_config:
  "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.cert_validator.dynamic_modules.v3.DynamicModuleCertValidatorConfig
  dynamic_module_config:
    module:
      local:
        filename: /etc/envoy/modules/libcert_validator.so
  validator_name: custom_validator
```


## Category: cryptography

### Use Authenticated Encryption and Secure Cryptographic Verification in Envoy

**Use when**

When configuring cryptographic operations, token encryption in filters, and signature verification routines.

**Secure rules**

**Rule 1: Enable AES-256-GCM encryption for OAuth2 cookie token protection**

When configuring Envoy's OAuth2 filter, ensure sensitive tokens stored in cookies are encrypted by setting `disable_token_encryption` to false and opting in to AES-256-GCM encryption mode via the `oauth2_use_gcm_encryption` feature flag to replace legacy CBC mode.

```yaml
http_filters:
- name: envoy.filters.http.oauth2
  typed_config:
    "@type": type.googleapis.com/envoy.extensions.filters.http.oauth2.v3.OAuth2Config
    disable_token_encryption: false
    credentials:
      client_id: "client_id"
      token_secret:
        name: "token_secret"
      hmac_secret:
        name: "hmac_secret"
```

**Rule 2: Always verify status results from signature verification operations**

Envoy's `verifySignature()` method returns a status object that evaluates to false on `result.ok()` when given unsupported hash algorithms, uninitialized key objects, altered data payloads, or corrupted signatures. Callers must evaluate `result.ok()` before trusting signed data.

```cpp
auto result = Envoy::Common::Crypto::UtilitySingleton::get().verifySignature("sha256", *key_object, signature_bytes, data_bytes);
if (!result.ok()) {
  ENVOY_LOG(warn, "Signature verification failed: {}", result.message());
  return;
}
```


## Category: csrf

### Configure SameSite Attributes and Expiration for OAuth2 State Cookies

**Use when**

Configuring OAuth2 authentication filters and cookies in Envoy to protect against cross-site request forgery and authorization state fixation attacks.

**Secure rules**

**Rule 1: Configure explicit SameSite restrictions and short expiration windows for OAuth2 cookies and CSRF state tokens.**

Set explicit `same_site` attributes such as `STRICT` for bearer, HMAC, and ID token cookies, and define short expiration windows for CSRF state tokens and PKCE code verifiers using `csrf_token_expires_in` and `code_verifier_token_expires_in`.

```yaml
csrf_token_expires_in:
  seconds: 300
code_verifier_token_expires_in:
  seconds: 300
cookie_configs:
  bearer_token_cookie_config:
    same_site: STRICT
  oauth_hmac_cookie_config:
    same_site: STRICT
  id_token_cookie_config:
    same_site: STRICT
```


## Category: deserialization

### Enforce strict Protobuf message validation during deserialization

**Use when**

When processing dynamic xDS configurations or local protobuf structures to prevent accepting unvalidated or smuggled fields.

**Secure rules**

**Rule 1: Execute strict downcasting and validation with recursion enabled when processing untrusted protobuf structures.**

Use `TestUtility::validate` with `recurse_into_any` set to true to enforce strict message integrity. Ensure exceptions such as `ProtoValidationException` and `EnvoyException` are caught and handled to prevent structural failures and rule validation bypasses.

```cpp
try {
  TestUtility::validate(bootstrap_config, /*recurse_into_any=*/true);
} catch (const ProtoValidationException& e) {
  // Handle rule validation failure
} catch (const EnvoyException& e) {
  // Handle unknown fields or structural failure
}
```


## Category: injection

### Percent-encode parameters in AWS STS AssumeRole query strings

**Use when**

When constructing query strings for AWS STS AssumeRole requests from user-configurable parameters.

**Secure rules**

**Rule 1: Always percent-encode parameter values when building AWS STS AssumeRole request paths.**

Prevent parameter injection and query string structure manipulation by applying `Envoy::Http::Utility::PercentEncoding::encode` to all parameters such as `role_arn`, `role_session_name`, and `external_id` before embedding them into query strings.

```cpp
std::string path = fmt::format("/?Version=2011-06-15&Action=AssumeRole&RoleArn={}&RoleSessionName={}",
                              Envoy::Http::Utility::PercentEncoding::encode(role_arn),
                              Envoy::Http::Utility::PercentEncoding::encode(role_session_name));
if (!external_id.empty()) {
  path += fmt::format("&ExternalId={}", Envoy::Http::Utility::PercentEncoding::encode(external_id));
}
```


## Category: input contract definition

### Preserve mandatory HTTP pseudo-headers in custom filters

**Use when**

Developing or modifying custom HTTP filters placed prior to the Envoy router filter.

**Secure rules**

**Rule 1: Ensure custom filter logic preserves all mandatory HTTP pseudo-headers before passing requests upstream.**

Envoy's router strictly validates required request headers such as `:method` using `Http::HeaderUtility::checkRequiredRequestHeaders`. Custom HTTP filters running before the router must not remove or drop these mandatory pseudo-headers, as doing so triggers an immediate local `503 Service Unavailable` response.

```cpp
Http::FilterHeadersStatus MyFilter::decodeHeaders(Http::RequestHeaderMap& headers, bool) {
  if (headers.Method().empty()) {
    headers.setMethod(Http::Headers::get().MethodValues.Get);
  }
  return Http::FilterHeadersStatus::Continue;
}
```


### Validate Certificate Pins and Ensure Upstream TLS Session Resumption Verification

**Use when**

Configuring upstream TLS validation contexts, certificate hashes, public key pins, or handling custom peer verification and session resumption.

**Secure rules**

**Rule 1: Validate certificate fingerprint formats correctly in upstream `CertificateValidationContext` configurations.**

Ensure that digests adhere strictly to expected encodings when configuring certificate pinning via `verify_certificate_hash` or public key pinning via `verify_certificate_spki`. `verify_certificate_hash` requires a valid 64-character hex-encoded SHA-256 string, while `verify_certificate_spki` requires a valid base64-encoded SHA-256 digest.

```yaml
validation_context:
  verify_certificate_hash:
  - "6B29D7B49E77D182E6939E092F04801AEA3979C8A5726203D4D51CE73420F620"
  verify_certificate_spki:
  - "Q29uZ3JhdHVsYXRpb25zLCB5b3UgZm91bmQgaXQh"
```

**Rule 2: Enable re-verification on session resumption for peer-verifying upstream TLS connections.**

Ensure that `SSL_CTX_set_reverify_on_resume` is enabled during TLS context initialization for peer-verifying connections to re-execute peer certificate validation when resuming a TLS session.

```cpp
if (verify_mode != SSL_VERIFY_NONE) {
  SSL_CTX_set_custom_verify(ctx, verify_mode, customVerifyCallback);
  SSL_CTX_set_reverify_on_resume(ctx, /*reverify_on_resume_enabled=*/1);
}
```


## Category: input interpretation safety

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


## Category: interface protocol hardening

### Enforce Kafka API Key and Topic Filtering for Messaging Security

**Use when**

Configuring downstream messaging filters and upstream routing rules for Kafka broker and mesh proxies.

**Secure rules**

**Rule 1: Restrict downstream Kafka client operational capabilities by configuring explicit request filtering via api_keys_allowed.**

Prefer an explicit allowlist using `api_keys_allowed` in the `kafka_broker` filter to strictly bound acceptable message operation types, preventing unauthorized message consumption or administrative actions.

```yaml
- name: envoy.filters.network.kafka_broker
  typed_config:
    "@type": type.googleapis.com/envoy.extensions.filters.network.kafka_broker.v3.KafkaBroker
    stat_prefix: restricted_producer
    api_keys_allowed:
    - 0 # Produce
    - 3 # Metadata
    - 18 # API versions
```

**Rule 2: Define explicit forwarding rules for Kafka mesh topic prefixes to designated upstream clusters.**

Configure deterministic `forwarding_rules` matching all authorized topic prefixes and mapping them to designated upstream clusters to avoid connection termination and unintentional message delivery across boundaries.

```yaml
forwarding_rules:
- target_cluster: kafka_c1
  topic_prefix: order_events
- target_cluster: kafka_c2
  topic_prefix: user_notifications
```


### Enforce Strict HTTP/2 and QUIC Protocol Options and Stream Limits

**Use when**

When configuring HTTP/2, HTTP/3, and QUIC options to maintain protocol framing, prevent sequence corruption, and restrict unsupported features.

**Secure rules**

**Rule 1: Validate HTTP/2 protocol options to prevent conflicting settings and unsupported features.**

Process and initialize `Http2ProtocolOptions` using `initializeAndValidateOptions` to catch parameter collisions, avoid duplicate settings, and ensure server push or raw `ENABLE_CONNECT_PROTOCOL` parameters are not improperly enabled.

```cpp
envoy::config::core::v3::Http2ProtocolOptions options;
options.mutable_hpack_table_size()->set_value(4096);
options.mutable_max_concurrent_streams()->set_value(100);

auto validated_options_or = Http2::Utility::initializeAndValidateOptions(options);
if (!validated_options_or.ok()) {
  // Handle validation error gracefully
}
```

**Rule 2: Restrict QPACK settings and configure HTTP/3 protocol options for QUIC clients.**

Explicitly set `Http3ProtocolOptions` parameters such as `disable_qpack` on Envoy QUIC client connections to disable Huffman encoding, disable cookie crumbling, and zero out the QPACK maximum dynamic table capacity.

```cpp
envoy::config::core::v3::Http3ProtocolOptions http3_options;
http3_options.set_disable_qpack(true);
session->setHttp3Options(http3_options);
```


### Prevent Observability Data and Internal Telemetry Exposure

**Use when**

Configuring Envoy routers, metric service sinks, and upstream host logging for edge or external-facing listeners.

**Secure rules**

**Rule 1: Suppress internal performance and proxy state headers on untrusted downstream responses.**

Set `suppress_envoy_headers` to `true` on the router filter (`envoy.filters.http.router`) for edge listeners to prevent leaking latency telemetry such as `x-envoy-upstream-service-time` and system health flags like `x-envoy-overloaded` to downstream clients.

```yaml
name: envoy.filters.http.router
typed_config:
  "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
  suppress_envoy_headers: true
```

**Rule 2: Restrict and sanitize per-endpoint metric generation and host logging.**

Ensure per-endpoint stats outputs and host logs generated via `HostUtility` are restricted to internal telemetry systems and filtered using stats tag extractors or prefix matchers to prevent exposing internal IP addresses, ports, and health failure flags.

```cpp
HostUtility::forEachHostMetric(cm, [](Stats::PrimitiveCounterSnapshot&& counter) {
  // Process counter securely or filter sensitive endpoint IP metric names
}, [](Stats::PrimitiveGaugeSnapshot&& gauge) {
  // Filter out host IP-identifying metrics from public endpoints
});
```


### Safely Rewrite, Sanitize, and Normalize HTTP Headers

**Use when**

Use when modifying, rewriting, sanitizing, or transforming HTTP request and response headers in Envoy dynamic modules, external processors, or custom routing filters.

**Secure rules**

**Rule 1: Use set instead of add when modifying HTTP headers in dynamic modules to completely overwrite values and prevent duplicate header injection.**

When modifying HTTP headers using the `HeaderMap` interface in Envoy dynamic modules, invoke `set(key, value)` rather than `add(key, value)` when replacing or sanitizing untrusted header inputs. The `add` method appends duplicate header entries rather than overwriting existing values, which can lead to header interpretation ambiguity or downstream security bypasses.

```cpp
void sanitizeAndRewriteHeaders(Envoy::DynamicModules::HeaderMap& headers, std::string_view user_id) {
  headers.remove("x-internal-token");
  headers.set("x-authenticated-user", user_id);
}
```

**Rule 2: Explicitly disable append mode when configuring external processor header mutations to ensure untrusted header values are overwritten.**

When rewriting request or response headers via Envoy external processing (`ext_proc`), configure `HeaderMutation` `set_headers` with `append` set to `false` when replacing untrusted downstream or upstream headers. Disabling header value appending prevents header duplication and ensures untrusted header values are overwritten rather than concatenated.

```cpp
envoy::service::ext_proc::v3::HeadersResponse headers_resp;
auto* mutation = headers_resp.mutable_response()->mutable_header_mutation();
auto* set_header = mutation->add_set_headers();
set_header->mutable_append()->set_value(false);
set_header->mutable_header()->set_key("x-custom-header");
set_header->mutable_header()->set_raw_value("validated_value");
```

**Rule 3: Normalize bridge header keys when copying them into Envoy header maps**

When converting an `envoy_headers` collection into an Envoy response header map, construct each copied key as a `LowerCaseString`. Copy both keys and values into the destination map before calling `release_envoy_headers`, because the source collection may be released after its contents have been copied.

```cpp
ResponseHeaderMapPtr transformed_headers = ResponseHeaderMapImpl::create();
for (envoy_map_size_t i = 0; i < headers.length; i++) {
  transformed_headers->addCopy(
      LowerCaseString(Bridge::Utility::copyToString(headers.entries[i].key)),
      Bridge::Utility::copyToString(headers.entries[i].value));
}
release_envoy_headers(headers);
```


### Validate and Harden HTTP Headers and Protocol Framing

**Use when**

When configuring HTTP connection managers, header validators, upgrade handling, and upstream protocol options in Envoy to prevent request smuggling, header spoofing, and protocol desynchronization.

**Secure rules**

**Rule 1: Configure the Envoy Default Header Validator to reject incoming requests with underscores in header names.**

Set `headers_with_underscores_action` to `REJECT_REQUEST` within the header validator configuration to prevent downstream clients from bypassing security controls or spoofing headers due to backend normalization.

```yaml
header_validator_config:
  headers_with_underscores_action: REJECT_REQUEST
```

**Rule 2: Sanitize and remove unauthorized upgrade tokens using utility helpers.**

Use Envoy HTTP utility helpers such as `Utility::removeUpgrade` with defined string matchers to strip unauthorized upgrade tokens systematically rather than performing manual string manipulation on connection and upgrade headers.

```cpp
std::vector<Envoy::Matchers::StringMatcherPtr> matchers;
envoy::type::matcher::v3::StringMatcher matcher;
matcher.set_exact("untrusted_protocol");
matchers.push_back(std::make_unique<Envoy::Matchers::StringMatcherImpl>(matcher, context));
Envoy::Http::Utility::removeUpgrade(request_headers, matchers);
```

**Rule 3: Enforce scheme header transformations for unencrypted mesh connections.**

Configure `scheme_header_transformation` in `HttpConnectionManager` when receiving HTTP/2 or HTTP/3 traffic over unencrypted mesh networks to overwrite untrusted incoming `:scheme` pseudo-headers and prevent upstream services from assuming false client security.

```yaml
typed_config:
  "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
  scheme_header_transformation:
    scheme_to_overwrite: "http"
```


## Category: network boundary

### Enforce Strict Internal Redirect Policies and Scheme Restrictions

**Use when**

Configuring Envoy HTTP route internal redirect policies where upstream services may trigger internal redirects.

**Secure rules**

**Rule 1: Disable cross-scheme internal redirects and restrict header copying.**

Set `allow_cross_scheme_redirect` to false in internal redirect policies to prevent silent secure-to-cleartext connection downgrades. Ensure system headers, pseudo-headers, and Host headers are not copied during redirects.

```yaml
internal_redirect_policy:
  allow_cross_scheme_redirect: false
  redirect_response_codes:
  - 302
  response_headers_to_copy:
  - x-custom-redirect-context
```


### Filter Resolved DNS Addresses in Dynamic Forward Proxies to Mitigate SSRF

**Use when**

Configuring dynamic forward proxies handling untrusted requests or domains in Envoy v1.39.0 to prevent unauthorized requests to internal networks or cloud metadata APIs.

**Secure rules**

**Rule 1: Enforce resolved address filtering via `DnsCacheConfig.resolved_address_filter` to block outbound connections to restricted networks, private IP ranges, localhost, link-local addresses, and cloud metadata services.**

Configure `resolved_address_filter` within the DNS cache configuration shared between the dynamic forward proxy filter and cluster to reject unsafe IP destinations. Combine this address filtering mechanism with network firewalls and egress RBAC rules, and monitor the `dns_cache.<dns_cache_name>.dns_address_filter_out` metric to audit and alert on blocked IP resolution attempts.

```yaml
name: envoy.filters.http.dynamic_forward_proxy
typed_config:
  '@type': type.googleapis.com/envoy.extensions.filters.http.dynamic_forward_proxy.v3.FilterConfig
  dns_cache_config:
    name: dynamic_forward_proxy_cache
    dns_lookup_family: V4_ONLY
    resolved_address_filter:
      address_prefix: 192.168.1.0
      prefix_len: 24
```


### Secure Forwarded Headers and Client IP Trust in Envoy Proxies

**Use when**

Configuring network boundaries, HTTP connection managers, proxy protocol listener filters, or client certificate header forwarding to ensure untrusted downstreams cannot spoof client IPs or identity.

**Secure rules**

**Rule 1: Sanitize incoming client certificate headers from untrusted downstreams before forwarding requests upstream.**

Ensure `x-forwarded-client-cert` headers from untrusted downstreams are sanitized by keeping `forward_client_cert_details` unset or configuring it to `SANITIZE` or `SANITIZE_SET` to prevent backend services from relying on spoofed identity details.

```yaml
typed_config:
  "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
  forward_client_cert_details: SANITIZE_SET
  set_current_client_cert_details:
    subject: true
    uri: true
```

**Rule 2: Restrict plain connections and enforce strict validation for PROXY protocol and client IP attributes.**

Keep `allow_requests_without_proxy_protocol` disabled (`false`) on network boundaries where all incoming traffic must pass through a proxy appending PROXY protocol headers, and ensure connection sockets enforce strict unicast address validation matching declared IP versions.

```yaml
listener_filters:
- name: envoy.filters.listener.proxy_protocol
  typed_config:
    "@type": type.googleapis.com/envoy.extensions.filters.listener.proxy_protocol.v3.ProxyProtocol
    allow_requests_without_proxy_protocol: false
```

**Rule 3: Explicitly configure trusted internal IP boundaries and original IP detection mechanisms.**

Define strict CIDR ranges in `internal_address_config` and configure `use_remote_address` or `xff_num_trusted_hops` to prevent external clients from forging `X-Forwarded-For` headers and bypassing IP-based access controls or GeoIP filters.

```yaml
name: envoy.filters.http.geoip
typed_config:
  "@type": type.googleapis.com/envoy.extensions.filters.http.geoip.v3.Geoip
  xff_config:
    xff_num_trusted_hops: 1
  provider:
    name: envoy.geoip_providers.maxmind
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.geoip_providers.maxmind.v3.MaxMindConfig
```

**Rule 4: Evaluate downstream connection source IPs directly for socket-level access policies.**

Use `envoy.matching.inputs.source_ip` (`SourceIPInput`) instead of unvalidated HTTP headers when enforcing IP-based access rules to evaluate the actual downstream connection source IP and prevent header-spoofing attacks.

```yaml
input:
  name: envoy.matching.inputs.source_ip
  typed_config:
    "@type": type.googleapis.com/envoy.extensions.matching.common_inputs.network.v3.SourceIPInput
custom_match:
  name: envoy.matching.matchers.ip
  typed_config:
    "@type": type.googleapis.com/xds.type.matcher.v3.IPMatcher
    range_matchers:
      - ranges:
          - address_prefix: 127.0.0.1
        on_match:
          action:
            name: envoy.filters.rbac.action
            typed_config:
              "@type": type.googleapis.com/envoy.config.rbac.v3.Action
              name: deny-request
              action: DENY
```


## Category: resource exhaustion

### Configure Bounded Retries, Timeouts, and Circuit Breakers to Prevent Upstream Exhaustion

**Use when**

Configuring Envoy routes, virtual hosts, and upstream clusters to handle network retries, timeouts, and request hedging safely.

**Secure rules**

**Rule 1: Enforce explicit global and per-try request timeouts along with bounded retry limits to prevent resource exhaustion and request amplification.**

Always define absolute upper bounds using global request timeouts and restrict individual attempts with per-try timeouts. Configure bounded `num_retries` and use retry budgets or circuit breaker thresholds to prevent retry storms.

```yaml
virtual_hosts:
- name: backend_service
  domains: ["*"]
  include_request_attempt_count: true
  retry_policy:
    retry_on: "5xx,connect-failure,reset"
    num_retries: 3
    per_try_timeout: 2s
circuit_breakers:
  thresholds:
  - retry_budget:
      budget_percent:
        value: 20.0
      min_retry_concurrency: 3
```

**Rule 2: Enable timeout budget statistics and track remaining retry circuit breaker metrics to monitor upstream latency and prevent cascading failures.**

Set `track_timeout_budgets` to true in cluster configuration and enable `track_remaining` on circuit breakers to continuously monitor retry limits and prevent unconstrained traffic spikes.

```yaml
clusters:
- name: service_backend
  type: STRICT_DNS
  track_timeout_budgets: true
  circuit_breakers:
    thresholds:
    - priority: DEFAULT
      max_retries: 3
      track_remaining: true
```


### Configure explicit request body and connection buffer limits to prevent memory exhaustion

**Use when**

Configuring virtual hosts, connection limits, or listeners in Envoy to handle untrusted incoming client connections and HTTP payloads.

**Secure rules**

**Rule 1: Set explicit request body buffer limits on virtual hosts to bound memory consumption.**

Configure `request_body_buffer_limit` explicitly in the virtual host proto configuration to prevent attacker-controlled requests with large HTTP payloads from exhausting proxy memory resources.

```yaml
virtual_hosts:
  - name: protected_vhost
    domains: ["api.example.com"]
    request_body_buffer_limit: 1048576
```

**Rule 2: Configure explicit per-connection buffer limits on Envoy listeners.**

Specify `per_connection_buffer_limit_bytes` explicitly in the listener configuration to constrain maximum memory allocated per connection and prevent out-of-memory denial-of-service crashes.

```yaml
address:
  socket_address:
    address: 127.0.0.1
    port_value: 1234
per_connection_buffer_limit_bytes: 32768
filter_chains:
- filters: []
  name: foo
```


## Category: runtime environment hardening

### Avoid OpenSSL Builds in Production Environments

**Use when**

Building and compiling Envoy for production deployment where security policy guarantees and security vulnerability response processes are required.

**Secure rules**

**Rule 1: Build Envoy with default BoringSSL or FIPS-compliant BoringSSL/AWS-LC configurations rather than OpenSSL.**

Avoid building Envoy with `--config=openssl` for production deployments unless strictly required. OpenSSL builds rely on dynamically loaded libraries, disable HTTP/3 (QUIC) support, and are explicitly excluded from the Envoy security policy.

```bash
bazel build //source/exe:envoy-static

# Or for FIPS compliance:
bazel build --config=boringssl-fips //source/exe:envoy-static
```


### Harden Envoy Container Deployments and Runtime Environments

**Use when**

Configuring container orchestrators, runtime security contexts, and deployment parameters for production Envoy instances.

**Secure rules**

**Rule 1: Run Envoy containers with a read-only root filesystem to prevent runtime modification.**

Set `readOnlyRootFilesystem: true` within the container security context for container orchestrators such as Kubernetes.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: envoy-pod
spec:
  containers:
  - name: envoy
    image: envoyproxy/envoy:v1.39.0
    securityContext:
      readOnlyRootFilesystem: true
```

**Rule 2: Execute Envoy container processes as an unprivileged non-root user.**

Configure dedicated non-root user identities using `ENVOY_UID` and `ENVOY_GID` environment variables while avoiding root (`0`) execution.

```console
$ docker run -d --name envoy \
    -e ENVOY_UID=777 \
    -e ENVOY_GID=777 \
    -p 80:8000 \
    -v $(pwd)/envoy.yaml:/etc/envoy/envoy.yaml \
    envoyproxy/envoy:v1.39.0
```


### Restrict Envoy Privileged Ports and File System Permissions

**Use when**

Configuring Envoy container execution users, port mappings, and file system paths to restrict access to privileged resources.

**Secure rules**

**Rule 1: Run Envoy as a non-user container and map host privileged ports to unprivileged container ports.**

Keep Envoy running as a non-root user such as the default UID/GID 101. Avoid running as root with `ENVOY_UID=0`, and configure Envoy to listen on unprivileged ports greater than 1024 inside the container while relying on runtime port mapping to forward host privileged ports.

```bash
$ docker run -d --name envoy -p 80:8000 envoyproxy/envoy:v1.39.0
```

**Rule 2: Validate file paths to restrict unauthorized access to privileged system directories.**

Perform path integrity checks using `Filesystem::Instance::illegalPath` before attempting filesystem operations to block unauthorized reads from privileged or restricted host directories such as `/proc`, `/sys`, and `/dev`.

```cpp
Filesystem::InstanceImpl file_system;
std::string target_path = "/proc/kallsyms";
if (file_system.illegalPath(target_path)) {
  ENVOY_LOG(warn, "Blocked access to restricted host path: {}", target_path);
  return;
}
auto result = file_system.fileReadToEnd(target_path);
```


## Category: secret handling

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


## Category: security control integrity

### Enforce Fail-Closed Behavior and Security Control Integrity Across Filters and Authentication

**Use when**

Configuring Envoy security filters, authorization hooks, and authentication mechanisms where failing open or bypassing checks could compromise security control integrity.

**Secure rules**

**Rule 1: Configure deny_at_disable on external authorization filters to ensure requests are denied when the filter is disabled.**

When setting up the `ext_authz` filter, configure `deny_at_disable` with a default value of true to ensure that dynamic runtime overrides or metadata matchers cannot cause requests to bypass authorization checks.

```yaml
typed_config:
  "@type": type.googleapis.com/envoy.extensions.filters.http.ext_authz.v3.ExtAuthz
  deny_at_disable:
    default_value: true
    runtime_key: envoy.ext_authz.deny_at_disable
```

**Rule 2: Prevent OAuth2 pass-through matcher evaluation on forward ID token headers.**

Ensure that `pass_through_matcher` rules do not target the header configured in `forward_id_token`. Envoy rejects configurations where pass-through matchers evaluate the forwarded ID token header to prevent external attackers from bypassing authentication.

```yaml
config:
  forward_id_token:
    header: "x-id-token"
  pass_through_matcher:
    - name: "x-internal-bypass-key"
      string_match:
        exact: "secret-bypass-value"
```


### Validate extension dependencies and enforce fail-closed factory instantiation

**Use when**

Developing dynamic extensions using Envoy's factory registry for dependency injection, such as implementing custom resource detectors.

**Secure rules**

**Rule 1: Ensure extension factory creation methods validate configurations and return non-null pointers or trigger clean initialization failure.**

When implementing custom resource detector factories via `ResourceDetectorFactory`, explicitly validate incoming configurations and ensure components return a valid instance or `nullptr` to allow Envoy to safely abort initialization via `EnvoyException` and maintain telemetry context integrity.

```cpp
class MyDetectorFactory : public ResourceDetectorFactory {
public:
  ResourceDetectorPtr createResourceDetector(const Protobuf::Message& config, Server::Configuration::ServerFactoryContext& context) override {
    if (!validateConfig(config)) {
      return nullptr;
    }
    return std::make_unique<MyDetector>();
  }
};
```
