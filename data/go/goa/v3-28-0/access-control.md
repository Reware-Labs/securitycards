# Security cards

Repository: `https://github.com/goadesign/goa#v3.28.0`
Documentation repository: `https://github.com/goadesign/goa.design#main`
Category: access control

## access control

### Exempt health check endpoints from global service authorization using NoSecurity

**Use when**

Defining health check, liveness probe, or management endpoints in the Goa DSL that need to bypass inherited global security requirements.

**Secure rules**

**Rule 1: Explicitly call NoSecurity within the health check method expression to allow unauthenticated access by monitoring systems and load balancers.**

When global security requirements are declared at the API or Service level, management and health endpoints inherit those authentication rules by default. To allow unauthenticated health probes to access these endpoints without exposing sensitive credentials or causing orchestrator failures, explicitly call `NoSecurity()` within the health check `Method` expression.

```go
Method("health-check", func() {
    Description("Check service health status")
    NoSecurity()
    HTTP(func() {
        GET("/healthz")
    })
})
```


### Verify User Ownership and Tenant Constraints on Data Access

**Use when**

When building data query and record update methods in Goa services where access must be restricted to the authenticated record owner or tenant.

**Secure rules**

**Rule 1: Verify record ownership and tenant constraints before processing data updates or queries.**

Always ensure that the authenticated user owns the requested record or belongs to the target tenant before allowing data modification or retrieval. Enforce explicit tenant and ownership checks in your service logic.
