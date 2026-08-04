# Security cards

Repository: `https://github.com/envoyproxy/envoy#v1.39.0`
Category: interface protocol hardening

## interface protocol hardening

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
