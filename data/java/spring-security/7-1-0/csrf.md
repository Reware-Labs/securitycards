# Security cards

Repository: `https://github.com/spring-projects/spring-security#7.1.0`
Category: csrf

## csrf

### Enable and Maintain CSRF Protection for Web Applications

**Use when**

Configuring Spring Security `HttpSecurity` or `ServerHttpSecurity` for web applications relying on cookie-based sessions or browser interactions.

**Secure rules**

**Rule 1: Keep CSRF protection enabled for session-authenticated state-changing HTTP requests**

Do not disable CSRF protection via `.csrf((csrf) -> csrf.disable())` unless building purely stateless applications authenticated solely via non-browser mechanisms like OAuth2 Bearer tokens.

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .authorizeHttpRequests((authorize) -> authorize
            .anyRequest().authenticated()
        )
        .csrf(Customizer.withDefaults());
    return http.build();
}
```

**Rule 2: Maintain BREACH Protection by Using Default XOR CSRF Token Request Handler**

Retain the default `XorCsrfTokenRequestAttributeHandler` rather than replacing it with `CsrfTokenRequestAttributeHandler` to apply random XOR masks to CSRF token values on every request and prevent side-channel compression attacks.

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf((csrf) -> csrf
            .csrfTokenRequestHandler(new XorCsrfTokenRequestAttributeHandler()
        );
    return http.build();
}
```

**Rule 3: Keep Cookie CSRF Token HttpOnly Unless JavaScript Access Is Required**

Construct `CookieCsrfTokenRepository` directly without disabling `HttpOnly` to protect the CSRF token cookie from client-side scripts unless frontend JavaScript specifically requires reading the cookie.

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf((csrf) -> csrf
            .csrfTokenRepository(new CookieCsrfTokenRepository())
        );
    return http.build();
}
```
