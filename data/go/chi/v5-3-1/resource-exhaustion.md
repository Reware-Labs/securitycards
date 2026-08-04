# Security cards

Repository: `https://github.com/go-chi/chi#v5.3.1`
Documentation repository: `https://github.com/go-chi/docs#master`
Category: resource exhaustion

## resource exhaustion

### Limit Request Body Size and Concurrency for Resource-Heavy Endpoints

**Use when**

When building endpoints or route groups that accept client payloads or execute resource-intensive operations and require protection against resource exhaustion and Denial of Service.

**Secure rules**

**Rule 1: Apply request size limits and concurrency controls to prevent server resource exhaustion.**

Use `middleware.RequestSize` to restrict allowable request body sizes and prevent unconstrained payload reading. Additionally, apply `middleware.Throttle` or `middleware.ThrottleWithOpts` to establish capacity ceilings and manage concurrent in-flight requests on expensive or sensitive routes.

```go
r := chi.NewRouter()
r.With(middleware.RequestSize(1048576)).With(middleware.ThrottleWithOpts(middleware.ThrottleOpts{
	Limit:          50,
	BacklogLimit:   100,
	BacklogTimeout: 5 * time.Second,
	StatusCode:     http.StatusTooManyRequests,
	RetryAfterFn: func(ctxDone bool) time.Duration {
		return 10 * time.Second
	},
})).Post("/api/heavy-process", heavyHandler)
```
