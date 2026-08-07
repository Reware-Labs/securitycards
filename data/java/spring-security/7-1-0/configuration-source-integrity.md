# Security cards

Repository: `https://github.com/spring-projects/spring-security#7.1.0`
Category: configuration source integrity

## configuration source integrity

### Configure Cross-Origin Resource Sharing in Spring Security with Explicit CORS Sources

**Use when**

Use when configuring cross-origin request handling, registering CORS filters, or defining CORS configuration sources for servlet or reactive Spring Security applications.

**Secure rules**

**Rule 1: Integrate CORS handling into the security filter chain using explicit configuration sources or default customizers.**

Enable CORS in Spring Security by calling `http.cors(Customizer.withDefaults())` or configuring a lambda customizer. Ensure that a valid `CorsConfigurationSource` bean (such as `UrlBasedCorsConfigurationSource`) is registered in the application context so that `CorsFilter` and `PreFlightRequestFilter` are correctly added to process pre-flight `OPTIONS` requests before authentication filters evaluate the request.

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .cors(Customizer.withDefaults());
    return http.build();
}

@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of("https://example.com"));
    configuration.setAllowedMethods(List.of("GET", "POST"));
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```

**Rule 2: Avoid mutually exclusive or disabled CORS configurations.**

Do not invoke both `configurationSource(...)` and `preFlightRequestHandler(...)` simultaneously on the CORS configurer, as Spring Security enforces mutual exclusion and throws an exception. Never disable CORS using `cors(CorsConfigurer::disable)` to bypass browser errors, and ensure explicit allowed origins are defined instead of insecure wildcard origins when protecting authenticated endpoints.

```java
http
    .cors((cors) -> cors.configurationSource(corsConfigurationSource()));
```
