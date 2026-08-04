# Security blueprint

Repository: `https://github.com/go-chi/chi#v5.3.1`

## Security posture

When developing applications with Chi, engineers must assume that routers provide minimal built-in access controls and rely entirely on correctly structured middleware pipelines to enforce security policies. Developers must explicitly manage authentication, request normalization, trust boundaries, and resource limits because unvalidated inputs and misordered middleware can easily bypass perimeter protections. Security-sensitive surfaces include route grouping, header-based routing, client IP resolution, and wildcard parameter extraction, all of which must fail closed when encountering unexpected or malicious inputs.

## Essential implementation rules

1. **Isolate Access Control and Authorization via Router Groups**

Apply access control and authorization middleware at the router group or subrouter level using `chi.NewRouter()`, `r.Route()`, or `r.Group()` before defining protected endpoints. Restrict sensitive administrative or debugging endpoints like `middleware.Profiler()` inside protected groups enforcing strict authorization.

2. **Adhere Strictly to Chi API and Compressor Contracts**

Pass strictly valid MIME types or trailing wildcard suffixes like `text/*` into compressor configuration constructors to avoid runtime panics. Register custom HTTP methods via `chi.RegisterMethod` sequentially during application initialization prior to routing, and write pass-through middleware using `next.ServeHTTP(w, r)` rather than deprecated constructor patterns.

3. **Validate Credentials Before Modifying Request Context**

Derive authentication state strictly from verified headers such as `Authorization` rather than unvalidated URL query parameters. Use custom unexported types for context keys to prevent collisions and pass updated request contexts downstream using `r.WithContext` after cryptographic validation.

4. **Configure Explicit Client IP Trust Boundaries**

Select only HTTP header names unconditionally overwritten by your edge proxy when using `middleware.ClientIPFromHeader`. Replace legacy real-ip logic with explicit trust configurations like `middleware.ClientIPFromXFF` containing trusted CIDR ranges to prevent IP spoofing.

5. **Enforce Default-Deny Fallback Handlers in Header Routing**

Explicitly configure a default handler via `RouteDefault` when routing requests using `middleware.RouteHeaders()` to prevent unmatched requests from silently bypassing security policies or failing open.

6. **Canonicalize Paths and Sanitize Wildcard Parameters**

Apply `middleware.CleanPath` early on the top-level router to canonicalize request paths and remove duplicate slashes before route matching occurs. Extract wildcard parameters using `chi.URLParam(r, "*")` and sanitize them thoroughly prior to file system access or downstream forwarding.

7. **Restrict Endpoints with Explicit HTTP Methods**

Define endpoints using HTTP method-specific routing functions such as `r.Get` and `r.Post` rather than generic catch-all handlers to automatically enforce HTTP status 405 Method Not Allowed semantics for unhandled methods.

8. **Limit Request Size and Concurrency for Resource Protection**

Apply `middleware.RequestSize` to restrict allowable request body sizes and prevent unconstrained payload reading. Protect expensive or sensitive routes against denial-of-service by applying `middleware.Throttle` or `middleware.ThrottleWithOpts`.

9. **Exclude Secrets and Tokens from Query Parameters and Logs**

Transmit sensitive tokens and personal identifiers via HTTP headers rather than URL query parameters to prevent request logging middleware such as `middleware.Logger` from capturing plaintext credentials in standard output or log sinks.

10. **Enforce Correct Global Middleware Ordering**

Register global security middleware like authentication, rate-limiting, and `middleware.Logger` via `r.Use(...)` prior to defining routes or mounting `middleware.SupressNotFound`. Position `middleware.Logger` before `middleware.Recoverer` to ensure panic stack traces are successfully logged.
