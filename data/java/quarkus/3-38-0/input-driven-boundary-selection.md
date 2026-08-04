# Security cards

Repository: `https://github.com/quarkusio/quarkus#3.38.0`
Category: input driven boundary selection

## input driven boundary selection

### Safely Resolve OIDC Tenants Using Validated Routing Context

**Use when**

Implementing custom tenant resolution via `TenantResolver` or `TenantConfigResolver` in a Quarkus OIDC multi-tenancy application.

**Secure rules**

**Rule 1: Validate request paths and verify routing context attributes before assigning tenant configurations to prevent cross-tenant access vulnerabilities.**

Check the `RoutingContext` for an existing attribute such as `tenant-id` before parsing request paths. Explicitly validate request paths against known allowed patterns before assigning tenant identifiers to prevent attackers from redirecting operations into unauthorized trust domains.

```java
@ApplicationScoped
public class CustomTenantResolver implements TenantResolver {
    @Override
    public String resolve(RoutingContext context) {
        String tenantId = context.get("tenant-id");
        if (tenantId != null) {
            return tenantId;
        }
        String path = context.request().path();
        if (path.startsWith("/tenant-a/")) {
            return "tenant-a";
        }
        return null;
    }
}
```
