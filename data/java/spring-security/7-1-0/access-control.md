# Security cards

Repository: `https://github.com/spring-projects/spring-security#7.1.0`
Category: access control

## access control

### Configure Explicit Access Rules and Catch-All Defaults in Spring Security

**Use when**

Configuring HTTP request authorization rules and default fallback restrictions across servlet or reactive applications.

**Secure rules**

**Rule 1: Define explicit authorization rules for protected endpoints and enforce a secure catch-all default rule at the end of the configuration chain.**

Use component-level Customizer lambdas with `authorizeHttpRequests` or `authorizeExchange` to explicitly permit public resources and restrict remaining paths with `.anyRequest().authenticated()` or `.anyExchange().authenticated()`. Ensure that custom authentication or submit pages are explicitly permitted using `.permitAll()` to prevent authorization lockout loops.

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .authorizeHttpRequests((authorize) -> authorize
            .requestMatchers("/login", "/public/**").permitAll()
            .anyRequest().authenticated()
        )
        .formLogin((form) -> form
            .loginPage("/login")
            .permitAll()
        );
    return http.build();
}
```


### Enforce OAuth 2.0 Scope and Authority Checks for Protected Endpoints

**Use when**

Securing resource server endpoints and applying scope-based access control for JWT or opaque token assertions.

**Secure rules**

**Rule 1: Enforce strict scope and authority restrictions on protected resource server endpoints.**

Apply authorization managers such as `OAuth2ReactiveAuthorizationManagers.hasScope` or `OAuth2AuthorizationManagers.hasScope` to verify required scopes. Account for Spring Security's default `SCOPE_` prefix mapped onto granted authorities when evaluating token claims and configuring method security rules.

```java
import static org.springframework.security.oauth2.core.authorization.OAuth2ReactiveAuthorizationManagers.hasScope;

@Bean
SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
    http
        .authorizeExchange((authorize) -> authorize
            .pathMatchers("/message/**").access(hasScope("message:read"))
            .anyExchange().authenticated()
        )
        .oauth2ResourceServer((oauth2) -> oauth2
            .jwt(Customizer.withDefaults())
        );
    return http.build();
}
```
