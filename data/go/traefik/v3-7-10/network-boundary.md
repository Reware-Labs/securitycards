# Security cards

Repository: `https://github.com/traefik/traefik#v3.7.10`
Category: network boundary

## network boundary

### Enforce Strict Entrypoint and Network Boundary Restrictions

**Use when**

Defining routers, ingress routes, and provider bindings that expose backend services across network interfaces.

**Secure rules**

**Rule 1: Configure distinct private and public entrypoints when using providers such as Knative to prevent public exposure of internal services.**

Define separate `privateEntrypoints` and `publicEntrypoints` in your provider configuration. Routes marked cluster-local should map exclusively to private entrypoints to ensure internal management APIs are not accidentally exposed to the public internet.

```yaml
providers:
  knative:
    publicEntrypoints:
      - webhttp
      - websecure
    privateEntrypoints:
      - internal
```

**Rule 2: Explicitly restrict entrypoints on `IngressRoute` and HTTP routers instead of relying on defaults that bind to all interfaces.**

Always explicitly define the `entryPoints` field for every HTTP router and `IngressRoute` resource. Omitting this field causes Traefik to attach the router to all configured entry points by default, potentially exposing internal routes on unencrypted or public networks.

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: private-admin-route
  namespace: default
spec:
  entryPoints:
    - websecure-internal
  routes:
    - match: Host(`admin.internal.example.com`)
      kind: Rule
      services:
        - name: admin-service
          port: 8080
```


### Restrict Forwarded Headers and External Name Resolutions

**Use when**

Configuring entrypoints and providers in Traefik to handle incoming proxy headers and internal service routing boundaries.

**Secure rules**

**Rule 1: Explicitly define trusted client proxy sources using `forwardedHeaders.trustedIPs` and keep `forwardedHeaders.insecure` disabled.**

Never enable `forwardedHeaders.insecure: true` in production environments because it trusts incoming `X-Forwarded-*` headers blindly. Always specify trusted IP addresses or CIDR blocks using `forwardedHeaders.trustedIPs` to prevent IP spoofing and bypasses of rate-limiting or authentication controls.

```yaml
entryPoints:
  websecure:
    address: :443
    forwardedHeaders:
      insecure: false
      trustedIPs:
        - "10.0.0.0/8"
        - "192.168.1.10/32"
```

**Rule 2: Disable `allowExternalNameServices` in Kubernetes CRD and Ingress providers to prevent server-side request forgery.**

Ensure `allowExternalNameServices` is set to `false` in the Traefik static configuration to stop Traefik from routing traffic to external CNAME DNS records. This prevents attackers from forcing proxy traffic to internal cloud metadata endpoints or internal infrastructure.

```toml
[providers.kubernetescrd]
  allowExternalNameServices = false
```
