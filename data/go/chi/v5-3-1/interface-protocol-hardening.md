# Security cards

Repository: `https://github.com/go-chi/chi#v5.3.1`
Documentation repository: `https://github.com/go-chi/docs#master`
Category: interface protocol hardening

## interface protocol hardening

### Enforce Strict HTTP Method Restrictions and Semantics

**Use when**

When registering endpoints and configuring routers to ensure requests strictly adhere to expected HTTP methods and protocol semantics.

**Secure rules**

**Rule 1: Use explicit HTTP method routing functions to restrict endpoints to expected methods.**

When defining endpoints, use HTTP method-specific routing functions such as `r.Get` and `r.Post` rather than generic catch-all handlers. Chi automatically responds with HTTP status 405 Method Not Allowed and populates the `Allow` header for requests using unhandled HTTP methods.

```go
r := chi.NewRouter()

// Explicitly register supported methods for the path
r.Get("/items", listItemsHandler)
r.Post("/items", createItemHandler)

// Unregistered methods (e.g., PUT /items) automatically receive HTTP 405
```
