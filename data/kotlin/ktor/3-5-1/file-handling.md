# Security cards

Repository: `https://github.com/ktorio/ktor#3.5.1`
Category: file handling

## file handling

### Prevent directory traversal by using Ktor static content routing and resource resolution APIs

**Use when**

Serving static files, directories, or embedded classpath resources from user-supplied paths or URL parameters.

**Secure rules**

**Rule 1: Use built-in static content DSL and resource resolution functions to automatically validate request paths and prevent directory traversal.**

Utilize Ktor's built-in static content DSL such as `staticFiles`, `staticResources`, and `staticFileSystem`, or call `call.resolveResource()` to serve files safely. These functions automatically validate request paths, block parent directory relative paths (`..`), URL-encoded dots (`%2e%2e`), or backslashes, and ensure that path traversal attempts cannot escape the defined static root directory.

```kotlin
routing {
    staticFiles("static", File("/app/public"))
}
```
