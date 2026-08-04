# Security cards

Repository: `https://github.com/traefik/traefik#v3.7.10`
Category: resource exhaustion

## resource exhaustion

### Configure Bounded Retries, Timeouts, and Health Checks

**Use when**

Configuring load balancing retries, upstream timeouts, active/passive health checks, and circuit breakers for backend services.

**Secure rules**

**Rule 1: Set explicit bounds on retry attempts, timeout durations, and maximum request body bytes.**

Configure finite limits for `attempts`, `timeout`, and `maxRequestBodyBytes` to prevent memory exhaustion from request body buffering and request amplification storms. Avoid setting `maxRequestBodyBytes` to `-1` and keep `retryNonIdempotentMethod` disabled unless upstream services explicitly support safe idempotent execution.

```yaml
http:
  middlewares:
    bounded-retry:
      retry:
        attempts: 3
        initialInterval: 100ms
        timeout: 10s
        maxRequestBodyBytes: 1048576
        retryNonIdempotentMethod: false
```

**Rule 2: Define explicit backend forwarding timeouts and health check timeout thresholds**

Specify explicit forwarding timeouts (`dialTimeout`, `responseHeaderTimeout`, `idleConnTimeout`) on servers transports and set `healthCheck.timeout` on load balancer services to prevent hanging connections and dead backends from consuming proxy resources.

```yaml
http:
  services:
    my-service:
      loadBalancer:
        healthCheck:
          path: "/health"
          interval: "10s"
          timeout: "3s"
        passiveHealthCheck:
          failureWindow: "3s"
          maxFailedAttempts: 3
  serversTransports:
    app-transport:
      forwardingTimeouts:
        dialTimeout: 30s
                responseHeaderTimeout: 60s
        idleConnTimeout: 60s
```


### Enforce Request Body Size and Rate Limits to Prevent Resource Exhaustion

**Use when**

When configuring Traefik middlewares or backend services to handle incoming HTTP requests and prevent resource starvation caused by unbounded request payloads or client request rates.

**Secure rules**

**Rule 1: Configure explicit maximum request and response body size limits on buffering and forwarding middlewares**

Set `maxRequestBodyBytes` and `maxResponseBodyBytes` on Buffering, and `maxBodySize` and `maxResponseBodySize` on ForwardAuth when it forwards bodies, to finite limits rather than leaving them unlimited.

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: limit-body-size
spec:
  buffering:
    maxRequestBodyBytes: 10485760
    memRequestBodyBytes: 2097152
```

**Rule 2: Enforce non-zero rate limits on rate-limiting middleware configurations.**

Ensure the `average` parameter is configured with a non-zero request rate when enabling the `rateLimit` middleware to prevent turning off rate limiting entirely.

```yaml
http:
  middlewares:
    ratelimit-protection:
      rateLimit:
        average: 100
        period: 1s
        burst: 200
```
