# Security cards

Repository: `https://github.com/spring-projects/spring-security#7.1.0`
Category: interface protocol hardening

## interface protocol hardening

### Enforce Strict HTTP Redirection, Caching, and Protocol Restrictions for OAuth and Token Endpoints

**Use when**

Developing or configuring OAuth 2.0 / OIDC clients, resource servers, authorization endpoints, and redirection callbacks where framing, caching headers, method constraints, and strict URI validation must be enforced.

**Secure rules**

**Rule 1: Prevent caching of sensitive OAuth 2.0 token responses and OIDC client registration endpoints by preserving standard non-cacheable HTTP headers.**

Ensure that intermediate reverse proxies and API gateways do not strip or overwrite the default `Cache-Control: no-store` and `Pragma: no-cache` response headers returned by Spring Security token and client configuration endpoints. When extending custom endpoints, explicitly set these cache prevention headers.

```java
response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
response.setHeader(HttpHeaders.PRAGMA, "no-cache");
```

**Rule 2: Align OAuth 2.0 redirection endpoint base URIs and matchers precisely with registered client redirect URIs.**

When customizing authorization response endpoint URIs or authentication matchers, explicitly align the `ClientRegistration.redirectUri` pattern with the custom base URI or matcher path so callbacks are correctly intercepted and processed without breaking authentication flows.

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .oauth2Login((oauth2) -> oauth2
            .redirectionEndpoint((redirection) -> redirection
                .baseUri("/login/oauth2/callback/*")
            )
        );
    return http.build();
}

ClientRegistration registration = CommonOAuth2Provider.GOOGLE.getBuilder("google")
    .clientId("google-client-id")
    .clientSecret("google-client-secret")
    .redirectUri("{baseUrl}/login/oauth2/callback/{registrationId}")
    .build();
```

**Rule 3: Reject dynamic client registration requests containing URI fragments or invalid redirect URI syntax.**

Enforce strict URL validation on client redirect URIs during dynamic client registration. Reject any redirect URIs containing URI fragments or invalid syntax with an `INVALID_REDIRECT_URI` error to prevent credential or authorization code leakage via DOM fragment manipulation.

```java
OidcClientRegistration clientRegistration = OidcClientRegistration.builder()
    .clientName("client-name")
    .redirectUri("https://client.example.com/callback")
    .build();
```
