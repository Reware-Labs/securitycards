# Security cards

Repository: `https://github.com/envoyproxy/envoy#v1.39.0`
Category: security control integrity

## security control integrity

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
