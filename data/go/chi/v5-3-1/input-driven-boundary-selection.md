# Security cards

Repository: `https://github.com/go-chi/chi#v5.3.1`
Documentation repository: `https://github.com/go-chi/docs#master`
Category: input driven boundary selection

## input driven boundary selection

### Enforce explicit default fallback handlers in header-based routing

**Use when**

When routing middleware execution using `middleware.RouteHeaders()` to apply security checks or access controls based on untrusted request headers.

**Secure rules**

**Rule 1: Explicitly configure a default handler via RouteDefault when routing requests using RouteHeaders to prevent unmatched requests from bypassing security policies.**

When using `middleware.RouteHeaders()`, requests that do not match configured header patterns or `RouteAny` rules will silently fall through to downstream handlers unless a fallback is provided. You must explicitly declare a `RouteDefault` handler to enforce safe default-deny or fallback policies for unrecognized header values.

```go
hr := middleware.RouteHeaders().
	Route("Host", "api.example.com", apiMiddleware).
	RouteDefault(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, "Invalid Host Header", http.StatusBadRequest)
		})
	})
```

**Rule 2: Reject requests with unexpected header values in the RouteDefault handler.**

Ensure that the handler passed to `RouteDefault` explicitly handles or rejects requests failing header verification rather than allowing them to proceed unrestricted.
