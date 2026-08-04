# Security cards

Repository: `https://github.com/go-chi/chi#v5.3.1`
Documentation repository: `https://github.com/go-chi/docs#master`
Category: secret handling

## secret handling

### Exclude Sensitive Data from Request Query Parameters and Logs

**Use when**

When building HTTP endpoints and configuring logging middleware with chi to prevent plaintext exposure of secrets in request URIs.

**Secure rules**

**Rule 1: Avoid passing secrets, tokens, or personal identifiers in URL query strings where `middleware.Logger` or `DefaultLogFormatter` can capture them in logs.**

Transmit sensitive tokens via HTTP headers rather than query parameters so that plaintext credentials are not logged in standard output or log sinks by request logging middleware.

```go
// Transmit sensitive tokens via HTTP headers rather than query parameters
// BAD: GET /api/data?access_token=secret_key
// GOOD: Pass token in Authorization header

r := chi.NewRouter()
r.Use(middleware.Logger)

r.Get("/api/data", func(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	// Process request securely...
})
```
