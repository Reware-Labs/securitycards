# Security cards

Repository: `https://github.com/beego/beego#v2.3.10`
Category: security control integrity

## security control integrity

### Halt Request Processing in Security Filters Using ReturnOnOutput

**Use when**

Registering access control, authentication, or input validation filters via `InsertFilter` where writing an error status code or response body must immediately halt downstream request processing.

**Secure rules**

**Rule 1: Pass WithReturnOnOutput(true) when registering security filters to ensure request processing halts immediately upon writing a response.**

When registering access control, authentication, or input validation filters via `InsertFilter` (such as at `BeforeRouter` or `BeforeExec`), pass `WithReturnOnOutput(true)` to ensure request processing halts immediately when the filter writes a response body or error status code. Failing to enable this option can cause execution to continue to subsequent filters or controller handlers even after an error response is written, leading to authorization bypasses.

```go
mux := web.NewControllerRegister()
mux.InsertFilter("/admin/*", web.BeforeRouter, func(ctx *context.Context) {
    if !isAuthorized(ctx) {
        ctx.Output.SetStatus(http.StatusForbidden)
        ctx.Output.Body([]byte("Access Denied"))
    }
}, web.WithReturnOnOutput(true))
```
