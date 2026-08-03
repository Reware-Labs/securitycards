# Security cards

Repository: `https://github.com/go-chi/chi#v5.3.1`
Documentation repository: `https://github.com/go-chi/docs#master`
Category: input interpretation safety

## input interpretation safety

### Canonicalize and Sanitize Request Paths and Parameters

**Use when**

When building HTTP routers and handling URL parameters, path extensions, or request path normalization in Chi

**Secure rules**

**Rule 1: Apply `middleware.CleanPath` early on the top-level router to canonicalize request paths and remove duplicate slashes before route matching.**

Use `middleware.CleanPath` as early middleware on the root router to canonicalize request paths by removing duplicate slashes before route matching occurs. Ensure it is added at the top-level router before sub-routers or route definitions, as it only modifies `rctx.RoutePath` when it has not yet been set.

```go
r := chi.NewRouter()
r.Use(middleware.CleanPath)

r.Get("/users/{id}", getUserHandler)
```

**Rule 2: Sanitize wildcard route parameters to prevent path traversal.**

When extracting parameters from wildcard routes using `chi.URLParam(r, "*")`, explicitly clean and sanitize the resulting path prior to using it in file system access or downstream request forwarding.

```go
r := chi.NewRouter()

r.Get("/docs/*", func(w http.ResponseWriter, r *http.Request) {
	param := chi.URLParam(r, "*")
	cleanPath := filepath.Clean(param)
	if strings.HasPrefix(cleanPath, "..") || strings.Contains(cleanPath, "/..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
})
```
