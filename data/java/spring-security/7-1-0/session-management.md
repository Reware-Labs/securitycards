# Security cards

Repository: `https://github.com/spring-projects/spring-security#7.1.0`
Category: session management

## session management

### Configure Secure Logout and Token Invalidation

**Use when**

Handling user logout, clearing remember-me cookies, and managing OIDC or server-side session termination.

**Secure rules**

**Rule 1: Configure the `Clear-Site-Data` header on user logout.**

Add a `HeaderWriterLogoutHandler` configured with `ClearSiteDataHeaderWriter` to issue the `Clear-Site-Data` HTTP header upon user logout, wiping local storage and cached credentials.

```java
HeaderWriterLogoutHandler clearSiteData = new HeaderWriterLogoutHandler(new ClearSiteDataHeaderWriter(ClearSiteDataHeaderWriter.Directive.ALL));

http
    .logout((logout) -> logout
        .addLogoutHandler(clearSiteData)
    );
```

**Rule 2: Configure OIDC Client Initiated Logout for complete session termination.**

Configure RP-Initiated Logout via `OidcClientInitiatedLogoutSuccessHandler` so that logging out of the application also terminates the session at the OpenID Provider.

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
	http
		.authorizeHttpRequests((authorize) -> authorize
			.anyRequest().authenticated()
		)
		.oauth2Login(Customizer.withDefaults())
		.logout((logout) -> logout
			.logoutSuccessHandler(oidcLogoutSuccessHandler())
		);
	return http.build();
}
```


### Configure Session Creation and Fixation Protection

**Use when**

Configuring session lifecycle management, authentication behavior, and state persistence policies for servlet or reactive applications.

**Secure rules**

**Rule 1: Enforce stateless session creation policies for APIs and resource servers.**

Configure `SessionCreationPolicy.STATELESS` in `sessionManagement` to prevent session creation and avoid storing requests in HTTP sessions when building stateless applications or OAuth2 resource servers.

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .sessionManagement((session) -> session
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
        );
    return http.build();
}
```

**Rule 2: Configure session fixation protection during authentication.**

Ensure session identifiers are migrated or replaced upon authentication using strategies like `changeSessionId()` or `newSession()` to prevent session fixation attacks.

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .sessionManagement(session -> session
            .sessionFixation(sessionFixation -> sessionFixation.newSession())
        );
    return http.build();
}
```

**Rule 3: Maintain disabled URL rewriting for sessions.**

Keep `disable-url-rewriting="true"` on the `<http>` element to prevent HTTP session IDs from being appended to application URLs and leaking via logs or headers.

```xml
<http disable-url-rewriting="true">
    <!-- Additional Security Configuration -->
</http>
```


### Enforce Concurrent Session Limits and Lifecycle Event Publishing

**Use when**

Controlling active user sessions, enforcing concurrent login limits, and managing session lifecycle events.

**Secure rules**

**Rule 1: Register an `HttpSessionEventPublisher` bean for concurrent session management.**

When configuring concurrent session management limitations via `sessionManagement()`, register an `HttpSessionEventPublisher` bean in the Spring ApplicationContext so that session destruction events are properly received.

```java
@Bean
public HttpSessionEventPublisher httpSessionEventPublisher() {
    return new HttpSessionEventPublisher();
}
```

**Rule 2: Enforce maximum session limits to prevent concurrent login abuse.**

Configure concurrent session controls via `maximumSessions()` and `maxSessionsPreventsLogin(true)` or dynamic `SessionLimit` rules to restrict the number of simultaneous active sessions allowed per user account.

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .sessionManagement(session -> session
            .invalidSessionUrl("/invalidSession")
            .maximumSessions(1)
            .maxSessionsPreventsLogin(true)
        );
    return http.build();
}
```
