# Security cards

Repository: `https://github.com/go-chi/chi#v5.3.1`
Documentation repository: `https://github.com/go-chi/docs#master`
Category: security control integrity

## security control integrity

### Order Security Middlewares and Controls First in the Chi Router Pipeline

**Use when**

When registering global middleware, constructing middleware chains, or setting up routing middleware in Chi applications to ensure security mechanisms execute reliably.

**Secure rules**

**Rule 1: Register global security middleware before declaring routes on the router mux.**

Always add global middleware functions like authentication, rate-limiting, and logging via `r.Use(...)` prior to defining any routes or sub-routers. Chi enforces this ordering by design and will panic if `Mux.Use` is invoked after routes have already been configured.

```go
r := chi.NewRouter()
r.Use(middleware.Logger)
r.Use(AuthMiddleware)
r.Get("/protected", ProtectedHandler)
```

**Rule 2: Mount global security controls before SupressNotFound in the middleware stack.**

Ensure that mandatory security controls intended for all traffic, such as rate limiters and IP blockers, are mounted before `middleware.SupressNotFound` in the middleware chain. Placing `SupressNotFound` above security middleware causes unmapped requests to short-circuit and bypass those controls.

```go
r := chi.NewRouter()
r.Use(rateLimiterMiddleware)
r.Use(middleware.SupressNotFound(r))
r.Use(expensiveBusinessMiddleware)
```

**Rule 3: Position the Logger middleware before Recoverer in the router pipeline.**

Always register `middleware.Logger` before `middleware.Recoverer` so that a `LogEntry` is attached to the request context via `WithLogEntry`, allowing the recoverer middleware to successfully format and log panic stack traces.

```go
r := chi.NewRouter()
r.Use(middleware.Logger)
r.Use(middleware.Recoverer)
r.Get("/", func(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("ok"))
})
```
