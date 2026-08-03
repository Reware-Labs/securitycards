# Security cards

Repository: `https://github.com/envoyproxy/envoy#v1.39.0`
Category: access control

## access control

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
