# Security cards

Repository: `https://github.com/spring-projects/spring-framework#v7.0.8`
Category: interface protocol hardening

## interface protocol hardening

### Configure HTTP Security and Cache Control Headers on Responses

**Use when**

Developing controllers, functional endpoints, or reactive server responses that serve sensitive data or require client-side security headers.

**Secure rules**

**Rule 1: Explicitly enforce security response headers and cache controls on HTTP responses**

When returning responses containing sensitive user data, configure applicable HTTP security headers using builder APIs and enforce strict cache restrictions with CacheControl.noStore() to prevent browsers and intermediary caches from retaining the response.

```java
ResponseEntity<UserData> response = ResponseEntity.ok()
    .cacheControl(CacheControl.noStore())
    .header("X-Content-Type-Options", "nosniff")
    .header("X-Frame-Options", "DENY")
    .body(userData);
```

**Rule 2: Protect HTTP security header integrity using defensive wrappers and copies.**

When passing `HttpHeaders` across security boundaries or downstream components, wrap headers using `HttpHeaders.readOnlyHttpHeaders(headers)` to prevent unauthorized modification of security configurations. Use `HttpHeaders.copyOf(headers)` when creating an isolated writable copy rather than the copy constructor.

```java
HttpHeaders readOnlyHeaders = HttpHeaders.readOnlyHttpHeaders(originalHeaders);
HttpHeaders writableCopy = HttpHeaders.copyOf(readOnlyHeaders);
writableCopy.set("X-Custom-Header", "value");
```


### Restrict Controller Endpoints to Explicit HTTP Methods

**Use when**

Developing Spring MVC controller endpoints that need to strictly enforce allowed HTTP methods and reject unexpected verbs.

**Secure rules**

**Rule 1: Explicitly declare supported HTTP methods on controller endpoints using dedicated mapping annotations.**

Use annotations such as `@GetMapping`, `@PostMapping`, or `@RequestMapping(method = ...)` to restrict controller endpoints to intended HTTP methods. Spring MVC automatically rejects unsupported methods with an HTTP 405 Method Not Allowed response and populates the `Allow` header.

```java
@Controller
public class MyController {

    @PostMapping("/submit")
    public ResponseEntity<Void> handlePost(@RequestParam("id") Long id) {
        // Handled securely only for POST requests
        return ResponseEntity.ok().build();
    }
}
```
