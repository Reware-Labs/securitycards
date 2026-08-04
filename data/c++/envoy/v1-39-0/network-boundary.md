# Security cards

Repository: `https://github.com/envoyproxy/envoy#v1.39.0`
Category: network boundary

## network boundary

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
