# Security cards

Repository: `https://github.com/go-chi/chi#v5.3.1`
Documentation repository: `https://github.com/go-chi/docs#master`
Category: access control

## access control

### Enforce Access Control Middleware Using Router Groups and Subrouters

**Use when**

When organizing routes in Chi and securing endpoints against unauthorized actions or cross-user access

**Secure rules**

**Rule 1: Apply access control and authorization middleware at the router group or subrouter level before defining protected endpoints.**

Use `chi.NewRouter()`, `r.Route()`, or `r.Group()` to isolate middleware stacks and ensure authentication, role checks, and resource loading are executed before handling requests.

```go
r := chi.NewRouter()

// Authenticated endpoints grouped under auth middleware
r.Group(func(r chi.Router) {
	r.Use(AuthMiddleware)
	r.Get("/user/profile", ProfileHandler)
	r.Post("/user/settings", SettingsHandler)
})
```

**Rule 2: Restrict access to sensitive administrative or profiler endpoints using authentication and network boundaries.**

Mount debugging endpoints like `middleware.Profiler()` or administrative subrouters inside protected route groups that enforce strict authorization checks or restrict exposure to internal networks.

```go
r := chi.NewRouter()

// Restrict pprof endpoints to authenticated administrators
r.Group(func(r chi.Router) {
	r.Use(RequireAdminAuth)
	r.Mount("/debug", middleware.Profiler())
})
```
