# Security cards

Repository: `https://github.com/envoyproxy/envoy#v1.39.0`
Category: resource exhaustion

## resource exhaustion

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
