# Security cards

Repository: `https://github.com/goadesign/goa#v3.28.0`
Documentation repository: `https://github.com/goadesign/goa.design#main`
Category: api contract misuse

## api contract misuse

### Invoke next exactly once in Goa server interceptors

**Use when**

Implementing custom Goa server interceptors to inspect, validate, or mutate requests and responses.

**Secure rules**

**Rule 1: Call the next endpoint function exactly once in server interceptors and handle returned errors properly**

When writing Goa `ServerInterceptors`, strictly invoke `next(ctx, info.RawPayload())` exactly once to progress through the interceptor chain, or return an explicit error or response early. Returning without invoking next short-circuits downstream interceptors and the endpoint, while duplicate calls can cause duplicate execution, and errors returned by next must not be inadvertently discarded.

```go
func (i *Interceptors) RequestAudit(ctx context.Context, info *RequestAuditInfo, next goa.Endpoint) (any, error) {
    res, err := next(ctx, info.RawPayload())
    if err != nil {
        return nil, err
    }
    return res, nil
}
```
