# Security cards

Repository: `https://github.com/go-chi/chi#v5.3.1`
Documentation repository: `https://github.com/go-chi/docs#master`
Category: authentication

## authentication

### Validate Authentication Credentials Before Setting Request Context

**Use when**

Developing authentication middleware to verify user identity before storing session or user state in the request context.

**Secure rules**

**Rule 1: Populate authentication state in the request context only after cryptographically validating session tokens, bearer tokens, or credentials, and never accept unvalidated inputs like URL query parameters.**

Authentication state must be strictly derived from verified credentials such as the `Authorization` header rather than untrusted query parameters. Use custom unexported types for context keys to prevent collisions, validate the incoming token or credentials securely, and pass the updated context down the request chain using `r.WithContext`.

```go
type contextKey string
const userCtxKey contextKey = "user.auth"

func AuthenticationMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("Authorization")
		user, err := validateToken(token)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		ctx := context.WithValue(r.Context(), userCtxKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
```
