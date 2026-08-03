# Security blueprint

Repository: `https://github.com/spring-projects/spring-framework#v7.0.8`

## Security posture

Spring Framework applications rely on explicit tenant isolation, rigorous parameter validation, and secure connection management to maintain integrity across web, database, and messaging components. The framework provides robust primitives for binding, routing, and expression evaluation, but assumes developers correctly configure strict authorization, input boundaries, and credential hygiene. Security-sensitive surfaces include dynamic routing, database adapters, SpEL evaluation contexts, and property binding where misconfigurations can lead to injection, data leakage, or unauthorized access. All authorization checks, resource bounds, and environment validations must fail closed to prevent runtime misbehavior.

## Essential implementation rules

1. **Enforce strict tenant and role authorization checks in Spring web components**

Explicitly set required roles using `setAuthorizedRoles` on `UserRoleAuthorizationInterceptor` and override `handleNotAuthorized` to return HTTP 403. Avoid wildcard origins and use `setAllowedOriginPatterns` with `setAllowCredentials(true)` for CORS configurations.

2. **Isolate database connections and clean up thread-bound credentials**

Pair calls to `setCredentialsForCurrentThread` with `removeCredentialsFromCurrentThread` in a `finally` block when using `UserCredentialsDataSourceAdapter` or `UserCredentialsConnectionFactoryAdapter`. Derive sharding keys dynamically and enforce explicit catalog and schema boundaries.

3. **Validate target types and binding-capable errors when invoking validation utilities**

Check object support using `validator.supports(target.getClass())` prior to validation and pass binding-capable `Errors` implementations such as `BeanPropertyBindingResult` for nested property paths.

4. **Validate required configuration properties during application startup**

Use `PropertySourcesPropertyResolver` to define mandatory configuration keys with `setRequiredProperties(...)` and invoke `validateRequiredProperties()` during bootstrapping to fail fast on missing secrets or settings.

5. **Explicitly configure message converters and restrict deserialized formats**

Disable default message converter registration by setting `register-defaults="false"` and explicitly specify safe HTTP message converters to control allowed payload formats.

6. **Validate normalized paths against storage root to prevent traversal**

Verify that normalized user-supplied paths start strictly with the designated base storage root directory and retain `PathResourceResolver` at the end of resource resolver chains.

7. **Prevent expression language injection by using safe contexts and variable binding**

Avoid concatenating untrusted input into SpEL expressions. Use `SimpleEvaluationContext` for data binding, pass parameters via evaluation context variables, and configure strict parser length and operation limits.

8. **Use parameterized queries and named parameters to prevent SQL injection**

Avoid custom validation queries in `DatabaseStartupValidator` and use named parameter placeholders or `NamedParameterUtils` instead of string concatenation when constructing R2DBC, JDBC, or StoredProcedure queries.

9. **Enforce deep bean validation and input boundaries on controller parameters**

Annotate nested structures with `@Valid`, use class-level `@Validated`, and explicitly validate controller parameters and binding errors. Set `@ModelAttribute(binding = false)` to mitigate mass assignment.

10. **Configure canonical URI parsing and reject alternate input interpretations**

Specify `UriComponentsBuilder.ParserType.WHAT_WG` for consistent URL parsing, prefer `PathPatternParser`, and validate dynamic class names against an explicit allowlist before calling `ClassUtils.forName`.

11. **Enforce strict HTTP security headers and cache controls on responses**

Configure security response headers, enforce strict cache restrictions using `CacheControl.noStore()`, and wrap headers using `HttpHeaders.readOnlyHttpHeaders()` or `HttpHeaders.copyOf()` to protect header integrity.

12. **Validate target URIs and hostnames to prevent server-side request forgery**

Strictly validate user-supplied URI parameters and target hosts against an explicit allowlist before passing them to `RestTemplate`, `WebClient`, or HTTP service proxies. Configure `DefaultUriBuilderFactory` with `EncodingMode.TEMPLATE_AND_VALUES`.

13. **Enforce strict size and collection limits to prevent resource exhaustion**

Configure safe upper limits for collection auto-growing via `setAutoGrowCollectionLimit`, cap SQL query collection parameters, and set explicit non-negative memory buffer limits for reactive JSON tokenizers and WebSocket frames.

14. **Disable debug mode and verbose logging in production environments**

Do not set `cglib.debugLocation` in production, ensure `logStackTraces` is set to false in cache error handlers, and avoid enabling DEBUG or TRACE logging levels for WebSocket handlers.

15. **Prevent secret disclosure in logs and string conversion**

Avoid logging credential values or parameter-value maps that contain secrets. Load credentials from external configuration sources instead of hardcoding them into source code or bean definitions.

16. **Maintain consistent path matching and non-final proxies to prevent security bypasses**

Ensure proxy target methods requiring security advice are non-final when using CGLIB AOP proxies, and align path matching strategies between security filters and web MVC handlers.

17. **Configure secure and HttpOnly cookie attributes for sessions**

Explicitly set `httpOnly(true)`, `secure(true)`, and SameSite policies when creating session cookies with `ResponseCookie` or `CookieWebSessionIdResolver`.
