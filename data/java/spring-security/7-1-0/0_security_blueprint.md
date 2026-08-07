# Security blueprint

Repository: `https://github.com/spring-projects/spring-security#7.1.0`

## Security posture

Spring Security enforces a comprehensive defense-in-depth security model across servlet and reactive applications, protecting authentication, authorization, session management, and cryptographic boundaries by default. Developers must explicitly define fine-grained request matchers, robust CORS configuration, and strict token validation rules while avoiding insecure fallback behaviors. Security-sensitive surfaces include credential stores, OAuth2/SAML endpoints, session fixation handlers, and dynamic client registration mechanisms, all of which must fail closed when misconfigured.

## Essential implementation rules

1. **Enforce Explicit HTTP Authorization Rules and Secure Defaults**

Define explicit authorization rules using component-level Customizer lambdas with `authorizeHttpRequests` or `authorizeExchange`, ensuring a secure catch-all rule such as `.anyRequest().authenticated()` is placed at the end of the chain. Explicitly permit public endpoints and authentication pages using `.permitAll()` to prevent infinite loops.

2. **Validate OAuth 2.0 Token Signatures, Issuers, Audiences, and Types**

Configure both `issuer-uri` and `audiences` on OAuth 2.0 resource servers, explicitly specify allowed JWS signature algorithms such as `RS256` or `RS512`, and enable type validation on JWT decoders to mitigate token confusion attacks.

3. **Secure Session Lifecycles and Enforce Fixation Protection**

Configure `SessionCreationPolicy.STATELESS` for pure REST APIs and resource servers, ensure session fixation protection uses `newSession()` or `changeSessionId()`, and register an `HttpSessionEventPublisher` bean to properly manage concurrent login limits.

4. **Maintain Robust CSRF and BREACH Protection**

Keep CSRF protection enabled for session-authenticated browser applications unless building purely stateless APIs, retain the default `XorCsrfTokenRequestAttributeHandler` to mitigate BREACH attacks, and keep cookie CSRF token repositories `HttpOnly` unless explicit client-side reading is required.

5. **Configure Secure CORS Sources and Avoid Wildcard Overlaps**

Integrate CORS handling into the filter chain using `http.cors(Customizer.withDefaults())` backed by a registered `CorsConfigurationSource` bean. Avoid invoking mutually exclusive configuration methods simultaneously and never disable CORS globally to bypass browser errors.

6. **Implement Strict SAML 2.0 Asserting Party Verification and Cryptography**

Initialize OpenSAML via `OpenSamlInitializationService.initialize()` and configure `SignatureSigningParameters` with explicit SHA-256 signature and digest algorithms. Verify SAML responses against trusted asserting party certificates and enforce standard assertion validation.

7. **Provide Explicit Handlers and Persistent Services for One-Time Token Login**

Always configure an explicit `OneTimeTokenGenerationSuccessHandler` bean along with a persistent `JdbcOneTimeTokenService` backed by a `DataSource` when enabling `.oneTimeTokenLogin()` to prevent context initialization errors and insecure in-memory storage.

8. **Enforce Strict Cryptographic Work Factors and Authenticated Encryption**

Construct `AesBytesEncryptor` explicitly with `CipherAlgorithm.GCM` and a secure random IV generator. Tune adaptive password encoders like `BCryptPasswordEncoder` to target a one-second verification duration, and explicitly configure SHA-256 for remember-me signature algorithms.

9. **Secure Dynamic Client Registration and Authorization Validation**

Validate and filter out arbitrary custom metadata claims during dynamic client registration to protect `ClientSettings` and `RegisteredClient`. When overriding authorization request validation, throw `OAuth2AuthorizationCodeRequestAuthenticationException` on failure and use exact string matching for redirect URIs.

10. **Harden Logout and Protocol Redirection Boundaries**

Add a `HeaderWriterLogoutHandler` with `ClearSiteDataHeaderWriter` and configure OIDC RP-Initiated Logout via `OidcClientInitiatedLogoutSuccessHandler`. Preserve standard non-cacheable HTTP headers on token and client configuration endpoints, ensure redirect URIs match precisely, and reject URIs containing fragments.
