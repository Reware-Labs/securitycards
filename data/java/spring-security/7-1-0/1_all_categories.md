# Security cards

Repository: `https://github.com/spring-projects/spring-security#7.1.0`

## Category: access control

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


## Category: api contract misuse

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


## Category: authentication

### Configure SAML 2.0 Asserting Party Verification and Assertion Validation

**Use when**

Integrating SAML 2.0 authentication providers and validating signed responses and assertions.

**Secure rules**

**Rule 1: Configure asserting party verification credentials and default assertion validation.**

Ensure SAML responses and assertions carry valid signatures verified against trusted identity provider certificates, and incorporate standard assertion validation using `AssertionValidator.withDefaults()`.

```yaml
spring:
  security:
    saml2:
      relyingparty:
        registration:
          adfs:
            assertingparty:
              entity-id: https://idp.example.com/issuer
              verification.credentials:
                - certificate-location: "classpath:idp.crt"
              singlesignon.url: https://idp.example.com/issuer/sso
```


### Implement Persistent Storage and Secure Delivery for One-Time Tokens

**Use when**

Configuring One-Time Token (OTT) authentication and magic link generation for user sign-in.

**Secure rules**

**Rule 1: Provide a custom success handler and a persistent token service for One-Time Tokens.**

Implement a custom token delivery handler to transmit magic links over trusted user channels and replace in-memory services with a persistent storage mechanism in production.

```java
@Bean
public OneTimeTokenService oneTimeTokenService(DataSource dataSource) {
    return new JdbcOneTimeTokenService(dataSource);
}
```


### Validate OAuth 2.0 Token Signatures, Issuer, and Audience Claims

**Use when**

Configuring OAuth 2.0 resource servers or client verification to authenticate incoming tokens securely.

**Secure rules**

**Rule 1: Validate token signature, issuer, and audience claims.**

Configure both `issuer-uri` and audiences or attach an explicit issuer validator when setting up an OAuth 2.0 resource server to ensure claims are verified before granting access.

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://idp.example.com
          audiences: https://my-resource-server.example.com
```


## Category: configuration source integrity

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


## Category: cryptography

### Configure Secure Cryptographic Primitives and Algorithms for SAML and JWT

**Use when**

Configuring cryptographic signature verification, message signing, and encryption for SAML 2.0 components and OAuth 2.0 JWT tokens.

**Secure rules**

**Rule 1: Enforce strict SHA-256 or stronger algorithms for SAML message signing and digest creation.**

Ensure OpenSAML is initialized via `OpenSamlInitializationService.initialize()` before constructing or signing SAML 2.0 objects, and configure `SignatureSigningParameters` with explicit SHA-256 signature and digest algorithms to prevent signature forgery.

```java
OpenSamlInitializationService.initialize();

SignatureSigningParameters parameters = new SignatureSigningParameters();
parameters.setSigningCredential(signingCredential);
parameters.setSignatureAlgorithm(SignatureConstants.ALGO_ID_SIGNATURE_RSA_SHA256);
parameters.setSignatureReferenceDigestMethod(SignatureConstants.ALGO_ID_DIGEST_SHA256);
parameters.setSignatureCanonicalizationAlgorithm(SignatureConstants.ALGO_ID_C14N_EXCL_OMIT_COMMENTS);
SignatureSupport.signObject(signableObject, parameters);
```

**Rule 2: Explicitly configure allowed JWS signature algorithms for JWT decoders.**

Explicitly configure the allowed JWS signature algorithms such as `RS256` or `RS512` for JWT verification through application configuration or decoder builders to prevent algorithm switching attacks.

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          jws-algorithms: RS512
          jwk-set-uri: https://idp.example.org/.well-known/jwks.json
```

**Rule 3: Ensure symmetric secret keys meet minimum length requirements for HMAC signing.**

When instantiating `NimbusJwtEncoder` using `NimbusJwtEncoder.withSecretKey(secretKey)`, ensure the provided `SecretKey` meets the minimum key length requirement of 256 bits for `HS256` to prevent offline brute-force attacks.

```java
SecretKey secretKey = new javax.crypto.spec.SecretKeySpec(secretBytes, "HmacSHA256");
JwtEncoder jwtEncoder = NimbusJwtEncoder.withSecretKey(secretKey)
    .algorithm(MacAlgorithm.HS256)
    .build();
```


### Use Authenticated Encryption and Secure Password Hashing Work Factors

**Use when**

Implementing authenticated encryption for sensitive payloads or configuring adaptive password hashing and token encryption services.

**Secure rules**

**Rule 1: Construct `AesBytesEncryptor` explicitly with GCM mode and a secure random IV generator.**

Construct `AesBytesEncryptor` explicitly with `CipherAlgorithm.GCM` and a secure random IV generator to avoid static zero-filled initialization vectors and ensure ciphertext integrity.

```java
BytesKeyGenerator ivGenerator = KeyGenerators.secureRandom(16);
AesBytesEncryptor encryptor = new AesBytesEncryptor(password, salt, ivGenerator, AesBytesEncryptor.CipherAlgorithm.GCM);
```

**Rule 2: Tune adaptive password encoder work factors to achieve target verification duration.**

When configuring adaptive password encoders such as `BCryptPasswordEncoder`, tune the work factor parameters so password verification takes approximately one second on the host system to resist offline brute-force attacks.

```java
PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);
```

**Rule 3: Explicitly specify SHA-256 for remember-me signature calculations.**

Ensure `TokenBasedRememberMeServices` uses SHA-256 for encoding signatures rather than legacy MD5 digest algorithms by setting the matching algorithm explicitly.

```java
TokenBasedRememberMeServices rememberMeServices = new TokenBasedRememberMeServices(
    "secureSecretKey",
    userDetailsService,
    TokenBasedRememberMeServices.RememberMeTokenAlgorithm.SHA256
);
rememberMeServices.setMatchingAlgorithm(TokenBasedRememberMeServices.RememberMeTokenAlgorithm.SHA256);
```


## Category: csrf

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


## Category: deserialization

### Enforce strict class allowlisting during custom credential deserialization

**Use when**

Configuring custom row mappers or credential deserializers via `setRowMapper(...)` or `setCredentialsDeserializer(...)` in `JdbcAssertingPartyMetadataRepository`.

**Secure rules**

**Rule 1: Configure an `ObjectInputFilter` with strict allowlisting when implementing custom deserialization for credentials.**

When custom deserialization logic must be provided, ensure that an `ObjectInputFilter` is assigned to the `ObjectInputStream` using strict allowlisting for allowed classes and boundary checks to prevent insecure Java deserialization.

```java
public class SecureCredentialDeserializer implements Deserializer<Collection<Saml2X509Credential>> {
    @Override
    public Collection<Saml2X509Credential> deserialize(InputStream in) throws IOException {
        ObjectInputStream oin = new ObjectInputStream(in);
        ObjectInputFilter filter = ObjectInputFilter.Config.createFilter(
            "org.springframework.security.saml2.core.Saml2X509Credential;" +
            "org.springframework.security.saml2.core.Saml2X509Credential$Saml2X509CredentialType;" +
            "java.util.LinkedHashSet;!*");
        oin.setObjectInputFilter(filter);
        try {
            return (Collection<Saml2X509Credential>) oin.readObject();
        } catch (ClassNotFoundException ex) {
            throw new IOException("Deserialization failed", ex);
        }
    }
}
```


## Category: input contract definition

### Validate and Filter Custom Metadata in Dynamic Client Registration

**Use when**

Implementing dynamic client registration in Spring Security OAuth 2.0 Authorization Server to handle custom metadata inputs securely.

**Secure rules**

**Rule 1: Explicitly define allowed claims and filter out arbitrary custom metadata claims during dynamic client registration.**

When accepting custom metadata during dynamic client registration, explicitly define allowed claims and convert them securely using customized converters or validators. Arbitrary custom claims that are not explicitly registered or validated should be filtered out and not persisted into `ClientSettings` or `RegisteredClient` to prevent clients from overwriting security-critical settings.

```java
OAuth2ClientRegistrationRegisteredClientConverter customConverter = new OAuth2ClientRegistrationRegisteredClientConverter();
http.oauth2AuthorizationServer(authorizationServer ->
    authorizationServer.clientRegistrationEndpoint(clientRegistration ->
        clientRegistration.clientRegistrationAuthenticationProvider(customAuthenticationProvider)
    )
);
```


## Category: input interpretation safety

### Enable JWT Type Header Validation to Prevent Token Confusion Attacks

**Use when**

Configuring JWT decoders for OAuth 2.0 and validating incoming token type headers to ensure security decisions use unambiguous token purpose interpretations.

**Secure rules**

**Rule 1: Enable type validation on JWT decoders to ensure tokens are explicitly checked for their intended type.**

When configuring decoders such as `NimbusJwtDecoder` or `NimbusReactiveJwtDecoder`, ensure that token type verification is active or that a custom `JwtTypeValidator` is explicitly registered via `setJwtValidator()` to prevent token confusion attacks where an alternate token purpose is exploited.

```java
NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withIssuerLocation("https://issuer.example.com")
    .validateType(true)
    .build();
```


## Category: interface protocol hardening

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


## Category: network boundary

### Configure Trusted Proxy Headers for OAuth 2.0 Redirect URIs

**Use when**

Deploying Spring Security applications behind a reverse proxy or load balancer to ensure that OAuth 2.0 redirect URIs resolve accurately using trusted network configuration.

**Secure rules**

**Rule 1: Configure reverse proxy header processing so that Spring Security correctly resolves the secure external scheme, host, and port for OAuth 2.0 redirect URIs.**

Ensure your reverse proxy forwards standard headers correctly and configure your application infrastructure to honor them. Set up redirect URIs consistently using `{baseUrl}/login/oauth2/code/{registrationId}` to prevent credential and authorization code exposure over unencrypted channels.

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
```


## Category: resource exhaustion

### Exchange Long-Term Password Credentials for Short-Term Tokens During Authentication

**Use when**

Handling initial user authentication and subsequent requests to prevent CPU and memory exhaustion caused by repeated password hashing.

**Secure rules**

**Rule 1: Exchange long-term credentials for short-term tokens upon successful authentication rather than re-evaluating password hashes on every request.**

Authenticate user credentials once during login to establish an HTTP session or issue an access token, and subsequently validate only the session or token on incoming requests. Re-evaluating adaptive one-way hashing functions on every request consumes excessive CPU and memory resources, leading to resource exhaustion and denial-of-service vulnerabilities.


## Category: runtime environment hardening

### Disable Spring Security Debug Infrastructure in Production

**Use when**

Configuring the application environment for production deployment.

**Secure rules**

**Rule 1: Omit or conditionally exclude the debug element in production environments.**

Do not enable the `debug` element in production environments because debug mode outputs detailed multi-line request filter logs that can expose sensitive information like authentication headers, tokens, and request parameters. Only include the `debug` element during active local development.

```xml
<!-- Development only -->
<debug />
```


## Category: secret handling

### Externalize Secrets for Opaque Token Introspection and OAuth2 Clients

**Use when**

Configuring OAuth2 clients, resources, or token introspection in Spring Security applications where credentials and client secrets are required.

**Secure rules**

**Rule 1: Omit client secrets for public OAuth 2.0 clients and use PKCE**

For clients running in environments that cannot maintain credential confidentiality, such as native or browser-based applications, do not configure a client secret. Configure the authorization-code client with `client-authentication-method: none`; Spring Security then applies PKCE to the authorization request.

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          okta:
            client-id: okta-client-id
            client-authentication-method: none
            authorization-grant-type: authorization_code
            redirect-uri: "{baseUrl}/authorized/okta"
        provider:
          okta:
            authorization-uri: https://dev-1234.oktapreview.com/oauth2/v1/authorize
            token-uri: https://dev-1234.oktapreview.com/oauth2/v1/token
```


## Category: security control integrity

### Throw Mandatory Exceptions on Custom Authorization Request Validation Failures

**Use when**

When implementing custom validation logic for OAuth2 authorization requests or pushed authorization requests to prevent bypassing validation checks.

**Secure rules**

**Rule 1: Throw OAuth2AuthorizationCodeRequestAuthenticationException upon validation failure and use exact string matching for redirect URIs.**

When overriding default validation in OAuth2AuthorizationCodeRequestAuthenticationProvider or OAuth2PushedAuthorizationRequestAuthenticationProvider, custom validators must throw `OAuth2AuthorizationCodeRequestAuthenticationException` if validation fails. Additionally, custom validators comparing requested redirect URIs against pre-registered client URIs must perform exact string matching to prevent open-redirect vulnerabilities or authorization code theft.

```java
static class CustomRedirectUriValidator implements Consumer<OAuth2AuthorizationCodeRequestAuthenticationContext> {
    @Override
    public void accept(OAuth2AuthorizationCodeRequestAuthenticationContext authenticationContext) {
        OAuth2AuthorizationCodeRequestAuthenticationToken authorizationCodeRequestAuthentication =
            authenticationContext.getAuthentication();
        RegisteredClient registeredClient = authenticationContext.getRegisteredClient();
        String requestedRedirectUri = authorizationCodeRequestAuthentication.getRedirectUri();

        if (!registeredClient.getRedirectUris().contains(requestedRedirectUri)) {
            OAuth2Error error = new OAuth2Error(OAuth2ErrorCodes.INVALID_REQUEST);
            throw new OAuth2AuthorizationCodeRequestAuthenticationException(error, null);
        }
    }
}
```


## Category: session management

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
