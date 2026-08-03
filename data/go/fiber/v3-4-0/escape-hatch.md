# Security cards

Repository: `https://github.com/gofiber/fiber#v3.4.0`
Category: escape hatch

## escape hatch

### Avoid Unsafe Reflection and Memory Manipulation in Context Adaptors

**Use when**

Integrating net/http handlers with Fiber and propagating request context.

**Secure rules**

**Rule 1: Avoid adaptor.CopyContextToFiberContext to prevent unsafe memory mutation and reflection usage.**

Use safe context propagation wrappers such as adaptor.HTTPHandlerWithContext and LocalContextFromHTTPRequest rather than mutating request contexts via reflection.

```go
app.Get("/hello", adaptor.HTTPHandlerWithContext(http.HandlerFunc(handleRequest)))

func handleRequest(w http.ResponseWriter, r *http.Request) {
    ctx, ok := adaptor.LocalContextFromHTTPRequest(r)
    if !ok || ctx == nil {
        http.Error(w, "missing context", http.StatusInternalServerError)
        return
    }
}
```
