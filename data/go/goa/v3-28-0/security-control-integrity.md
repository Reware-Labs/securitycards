# Security cards

Repository: `https://github.com/goadesign/goa#v3.28.0`
Documentation repository: `https://github.com/goadesign/goa.design#main`
Category: security control integrity

## security control integrity

### Enforce Interceptor Execution Order and Short-Circuit on Validation Failure

**Use when**

When implementing custom server interceptors, wrapping generated endpoints, or managing execution paths in Goa services to ensure security controls run first and fail closed.

**Secure rules**

**Rule 1: Short-circuit execution and return an error immediately upon security validation failure in interceptors**

Validate inputs or permissions in custom server interceptors prior to invoking the next handler in the chain. If validation fails, return an error immediately and do not invoke `next(ctx, ...)` to prevent unauthorized or invalid requests from executing underlying service logic.

```go
func (i *Interceptors) ValidateRequest(ctx context.Context, info *RequestInfo, next goa.Endpoint) (any, error) {
    if err := checkPermissions(ctx, info); err != nil {
        return nil, err // Stop execution chain
    }
    return next(ctx, info.RawPayload())
}
```

**Rule 2: Order interceptors to enforce security checks before business logic execution**

Account for Goa's generated wrapper chain structure when defining interceptors, ensuring security-critical checks such as authentication or audit logging run on incoming requests before payload processing or business execution.

```go
// Conceptual order in generated wrapper:
func WrapGetEndpoint(endpoint goa.Endpoint, i ServerInterceptors) goa.Endpoint {
    endpoint = wrapGetRequestAudit(endpoint, i)
    endpoint = wrapGetJWTAuth(endpoint, i)
    return endpoint
}
```
