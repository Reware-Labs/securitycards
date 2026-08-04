# Security cards

Repository: `https://github.com/spring-projects/spring-framework#v7.0.8`
Category: access control

## access control

### Enforce strict tenant and role authorization checks in Spring web components

**Use when**

Developing or configuring interceptors, CORS rules, and HTTP requests requiring role-based access control or tenant isolation in Spring MVC and WebFlux applications.

**Secure rules**

**Rule 1: Configure explicit authorized roles and secure authorization handling in interceptors**

Explicitly set required roles using `setAuthorizedRoles` on `UserRoleAuthorizationInterceptor` to avoid defaulting to a denied state or over-permissive behavior. When extending the interceptor, override `handleNotAuthorized` to correctly signal authorization failures using HTTP error codes like `HttpServletResponse.SC_FORBIDDEN`.

```java
public class CustomRoleAuthorizationInterceptor extends UserRoleAuthorizationInterceptor {
    @Override
    protected void handleNotAuthorized(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws ServletException, IOException {
        response.sendError(HttpServletResponse.SC_FORBIDDEN, "Access denied: insufficient roles");
    }
}
```

**Rule 2: Restrict CORS origin patterns and configure explicit mappings for protected endpoints**

Avoid wildcard origins and empty `<mvc:cors/>` tags that expose endpoints globally. Use `setAllowedOriginPatterns` or explicit `allowed-origin-patterns` along with `setAllowCredentials(true)` to secure cross-origin resource sharing.

```java
CorsConfiguration config = new CorsConfiguration();
config.setAllowedOriginPatterns(List.of("https://*.example.com"));
config.setAllowCredentials(true);
config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
```


### Isolate database connections and clean up thread-bound credentials and shards

**Use when**

Managing database connection adapters, multi-tenant schemas, or thread-local security identities in Spring JDBC components.

**Secure rules**

**Rule 1: Clear thread-bound database credentials in a finally block**

Always pair calls to `setCredentialsForCurrentThread` with a call to `removeCredentialsFromCurrentThread` inside a `finally` block when using `UserCredentialsDataSourceAdapter` to prevent cross-tenant data leakage across reused worker threads.

```java
UserCredentialsDataSourceAdapter adapter = new UserCredentialsDataSourceAdapter();
adapter.setTargetDataSource(targetDataSource);
try {
    adapter.setCredentialsForCurrentThread(username, password);
    try (Connection conn = adapter.getConnection()) {
        // Perform database operations under user credentials
    }
} finally {
    adapter.removeCredentialsFromCurrentThread();
}
```

**Rule 2: Safely map authenticated request context to database shards and schemas**

Derive sharding keys dynamically from authenticated security contexts using `ShardingKeyDataSourceAdapter`, throwing an exception if the context is unauthenticated. Additionally, enforce catalog and schema boundaries using `setCatalog` and `setSchema` on driver-based data sources.

```java
DriverManagerDataSource dataSource = new DriverManagerDataSource();
dataSource.setUrl("jdbc:postgresql://localhost:5432/appdb");
dataSource.setCatalog("appdb");
dataSource.setSchema("tenant_isolated_schema");
```
