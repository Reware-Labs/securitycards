# Security cards

Repository: `https://github.com/go-chi/chi#v5.3.1`
Documentation repository: `https://github.com/go-chi/docs#master`
Category: api contract misuse

## api contract misuse

### Adhere to Chi API Contracts and Correct Argument Signatures

**Use when**

Integrating Chi routers, middleware components, and custom HTTP method handlers into a Go application.

**Secure rules**

**Rule 1: Pass strictly valid MIME types or trailing wildcard suffixes into compressor configuration constructors.**

When configuring `middleware.Compress` or `middleware.NewCompressor`, specify exact MIME types or trailing wildcard suffixes such as `text/*`. Avoid passing unsupported wildcard patterns like `*/*` to prevent immediate runtime panics during router initialization.

```go
compressor := middleware.NewCompressor(5, "text/*", "application/json", "image/*")
r.Use(compressor.Handler)
```

**Rule 2: Register custom HTTP methods sequentially during application initialization prior to routing.**

Always call `chi.RegisterMethod` during initial setup before starting the HTTP server or registering routes. Never invoke it dynamically from request handlers or concurrent goroutines to prevent data races and runtime crashes.

```go
func main() {
    chi.RegisterMethod("PURGE")
    r := chi.NewRouter()
    r.MethodFunc("PURGE", "/cache", handlePurge)
}
```

**Rule 3: Construct pass-through middleware functions that correctly invoke the next handler in the execution chain.**

Do not use `middleware.New` for wrapping pass-through middleware such as authentication or context injection, as it deliberately ignores downstream handlers and routes. Instead, write middleware functions that accept `next http.Handler` and explicitly call `next.ServeHTTP(w, r)`.

```go
func CustomAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !isValidUser(r) {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}
```
