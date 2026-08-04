# Security cards

Repository: `https://github.com/beego/beego#v2.3.10`
Category: access control

## access control

### Configure Explicit CORS Origins and Avoid Global Wildcards with Credentials

**Use when**

Configuring Cross-Origin Resource Sharing (`CORS`) filters for web applications or API routes using `beego`.

**Secure rules**

**Rule 1: Specify explicit origin domains in `AllowOrigins` instead of enabling wildcard origins when handling sensitive resources or credentials.**

When setting up `cors.Options` via `beego.InsertFilter`, avoid using `AllowAllOrigins` or wildcard configurations alongside `AllowCredentials: true`. Explicitly list trusted domains in `AllowOrigins` to prevent unauthorized cross-origin entities from making authenticated requests and reading protected response data.

```go
beego.InsertFilter("/api/*", beego.BeforeRouter, cors.Allow(&cors.Options{
    AllowOrigins:     []string{"https://app.example.com"},
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
    AllowCredentials: true,
}))
```


### Enforce Casbin Authorization Filters and Policy Middleware Before Route Handlers

**Use when**

Enforcing access control, user roles, and permissions across backend endpoints prior to controller execution.

**Secure rules**

**Rule 1: Register the Casbin authorizer filter at the web.BeforeRouter stage to evaluate access policies before controller handlers run.**

When integrating Casbin authorization into Beego applications using `authz.NewAuthorizer`, register the filter at the `web.BeforeRouter` stage. This ensures authorization rules based on user roles, HTTP methods, and requested paths are evaluated and enforced before request handlers run, returning HTTP `403 Forbidden` for unauthorized requests.

```go
e := casbin.NewEnforcer("authz_model.conf", "authz_policy.csv")
handler := web.NewControllerRegister()
handler.InsertFilter("*", web.BeforeRouter, authz.NewAuthorizer(e))
```

**Rule 2: Always write an error response when access control checks fail inside policy functions to terminate unauthorized requests.**

Beego policy middleware functions (`PolicyFunc`) enforce access control before controller execution. Always write an HTTP response status or body within `PolicyFunc` handlers whenever access control checks fail to ensure `cont.ResponseWriter.Started` is set to true and request handling is halted.

```go
web.Policy("/api/admin/*", "*", func(ctx *context.Context) {
    if !userIsAdmin(ctx) {
        ctx.Output.SetStatus(403)
        _ = ctx.Output.Body([]byte("Forbidden"))
        return
    }
})
```
