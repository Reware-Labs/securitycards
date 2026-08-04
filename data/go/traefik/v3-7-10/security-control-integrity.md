# Security cards

Repository: `https://github.com/traefik/traefik#v3.7.10`
Category: security control integrity

## security control integrity

### Enforce Fail-Closed Behavior and Correct Ordering for Security Controls

**Use when**

Configuring security middleware, rate limiting backends, or TLS default options where failure handling and execution order must prevent security control bypass or degradation.

**Secure rules**

**Rule 1: Keep denyOnError enabled to ensure requests fail closed when storage backends are unavailable**

For Traefik Hub's Distributed RateLimit middleware, maintain `denyOnError` set to true so that incoming requests fail closed when the Redis storage backend becomes unreachable, preventing rate limiting bypass.

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: test-distributedratelimit
  namespace: traefik
spec:
  plugin:
    distributedRateLimit:
      burst: 200
      limit: 100
      period: 1s
      denyOnError: true
      store:
        redis:
          endpoints:
            - redis-master.traefik.svc.cluster.local:6379
```

**Rule 2: Apply security middlewares at the required trust boundary and preserve execution order**

Attach security-critical middlewares to every applicable router or to the service when all routers using it must be protected; router-level middlewares run before service-level middlewares, and each list runs in declaration order.

```yaml
http:
  routers:
    secure-router:
      rule: "Host(`app.example.com`)"
      service: my-service
      middlewares:
        - auth-middleware@file
        - rate-limit@file
  services:
    my-service:
      loadBalancer:
        servers:
          - url: "http://10.0.0.1:8080"
```

**Rule 3: Maintain a single cluster-wide default TLS option to prevent fallback degradation**

Maintain at most one TLSOption resource named `default` across all namespaces to prevent duplicate resources from being dropped and Traefik's internal default TLS options from being used.

```yaml
apiVersion: traefik.io/v1alpha1
kind: TLSOption
metadata:
  name: default
  namespace: traefik-system
spec:
  minVersion: VersionTLS12
  sniStrict: true
```
