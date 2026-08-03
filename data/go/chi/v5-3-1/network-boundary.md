# Security cards

Repository: `https://github.com/go-chi/chi#v5.3.1`
Documentation repository: `https://github.com/go-chi/docs#master`
Category: network boundary

## network boundary

### Configure explicit trusted proxy settings for client IP parsing

**Use when**

Setting up HTTP routers behind reverse proxies or load balancers where client IP addresses must be securely resolved without falling back to vulnerable default header parsing.

**Secure rules**

**Rule 1: Replace deprecated `RealIP` middleware with explicit `ClientIPFrom*` trust configurations tailored to your deployment topology.**

The legacy `RealIP` middleware was vulnerable to IP spoofing because it blindly trusted leftmost `X-Forwarded-For` headers. Instead, use explicit trust configurations such as `ClientIPFromXFF` with explicit CIDR ranges to ensure attacker-injected header values cannot bypass IP-based access controls or logging.

```go
r := chi.NewRouter()
r.Use(middleware.ClientIPFromXFF(
	"13.32.0.0/15",
	"2600:9000::/28",
))

r.Get("/profile", func(w http.ResponseWriter, r *http.Request) {
	clientIP := middleware.GetClientIP(r.Context())
	// Use clientIP for rate limiting or access control
})
```
