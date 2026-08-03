# Security cards

Repository: `https://github.com/traefik/traefik#v3.7.10`
Category: access control

## access control

### Enforce Role-Based Access Control and Token Claim Validation

**Use when**

When configuring authentication and authorization middleware to evaluate token claims and enforce role or scope constraints before forwarding requests to backend services.

**Secure rules**

**Rule 1: Enforce attribute and role-based access control by validating specific token claims**

In Traefik Hub, configure claims expressions within OAuth2 or JWT middleware configurations to verify that authenticated tokens contain authorized roles, groups, or scopes before allowing access to protected routes.

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: admin-jwt-auth
  namespace: apps
spec:
  plugin:
    jwt:
      jwksUrl: https://identity.example.com/realms/production/protocol/openid-connect/certs
      claims: Equals(`grp`, `admin`)
      forwardHeaders:
        Group: grp
```


### Restrict Route and Service Exposure Using Source IP Allowlists and Network Scoping

**Use when**

When configuring network access controls, source IP restrictions, and namespace boundary limits to prevent unauthorized external access or cross-provider resource exposure in Traefik.

**Secure rules**

**Rule 1: Restrict incoming route and service access using explicit source IP ranges and allowlist middlewares**

Implement network access control by defining source IP CIDR ranges within `ipAllowList` middleware resources or `ipAllowList` fields in `MiddlewareTCP` resources, ensuring external traffic is limited to trusted networks.

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: ip-allowlist
  namespace: default
spec:
  ipAllowList:
    sourceRange:
      - 127.0.0.1/32
      - 10.0.0.0/8
```

**Rule 2: Limit cross-provider namespace references to prevent unauthorized internal service exposure.**

Explicitly configure `crossProviderNamespaces` in static configuration to restrict which Kubernetes namespaces are permitted to declare cross-provider references or bind to internal services.

```toml
[providers.kubernetescrd]
  crossProviderNamespaces = ["traefik-system", "admin-tools"]
```
