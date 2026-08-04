# Security cards

Repository: `https://github.com/spring-projects/spring-framework#v7.0.8`
Category: security control integrity

## security control integrity

### Maintain Consistent Path Matching and Non-Final Proxies to Prevent Security Control Bypasses

**Use when**

Configuring Spring WebMVC path matching configurations or implementing AOP security proxies.

**Secure rules**

**Rule 1: Avoid marking proxy target methods as final when applying security advice.**

When using CGLIB class-based AOP proxies, ensure that methods requiring security interceptors or authorization checks are non-final. Marking them as final prevents CGLIB from overriding and intercepting them, which silently bypasses security checks.

```java
@Service
public class UserService {
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(String userId) {
        // business logic
    }
}
```

**Rule 2: Align path matching strategies between security filters and web MVC handlers.**

Ensure that security authorization layers are explicitly configured to use the same path matching algorithm as the underlying WebMVC handler mappings to prevent subtle parsing discrepancies and authorization bypasses.

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(auth -> auth
        .requestMatchers(new AntPathRequestMatcher("/api/**")).hasRole("ADMIN")
    );
    return http.build();
}
```
