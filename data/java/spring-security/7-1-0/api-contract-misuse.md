# Security cards

Repository: `https://github.com/spring-projects/spring-security#7.1.0`
Category: api contract misuse

## api contract misuse

### Configure Explicit Handlers and Service Beans for Spring Security Feature DSLs

**Use when**

When enabling feature DSLs like `.oneTimeTokenLogin()` that require explicitly provided handlers or service beans to prevent context initialization or runtime failures.

**Secure rules**

**Rule 1: Provide an explicit success handler bean when configuring one-time token login.**

Always configure an explicit `OneTimeTokenGenerationSuccessHandler` bean or DSL property when enabling `.oneTimeTokenLogin()`, as relying on `Customizer.withDefaults()` without providing a generation handler bean causes a context initialization failure.

```java
@Bean
SecurityFilterChain securityFilterChain(HttpSecurity http, OneTimeTokenGenerationSuccessHandler ottSuccessHandler) throws Exception {
    http
        .authorizeHttpRequests((authorize) -> authorize
            .anyRequest().authenticated()
        )
        .oneTimeTokenLogin((ott) -> ott
            .tokenGenerationSuccessHandler(ottSuccessHandler)
        );
    return http.build();
}

@Bean
OneTimeTokenGenerationSuccessHandler ottSuccessHandler() {
    return new RedirectOneTimeTokenGenerationSuccessHandler("/login/ott");
}
```
