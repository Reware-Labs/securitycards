# Security cards

Repository: `https://github.com/quarkusio/quarkus#3.38.0`
Category: authentication

## authentication

### Configure Multifactor Verification and Certificate Binding for Identity Assurance

**Use when**

Implementing WebAuthn multi-factor authentication or binding access tokens to client certificates in mTLS environments.

**Secure rules**

**Rule 1: Require user verification and user presence for WebAuthn authenticators.**

Ensure `userVerification` remains set to `required` and `userPresenceRequired` is set to `true` when configuring WebAuthn authentication mechanisms to maintain proper multifactor verification standards.

```properties
quarkus.webauthn.user-verification=required
quarkus.webauthn.user-presence-required=true
```

**Rule 2: Enable access token certificate binding in mTLS environments.**

Set `quarkus.oidc.token.binding.certificate=true` so `OidcIdentityProvider` verifies that the confirmation claim in the access token matches the client X.509 certificate thumbprint from the TLS session.

```properties
quarkus.oidc.token.binding.certificate=true
quarkus.http.ssl.client-auth=required
```


### Configure OIDC and JWT Token Signature, Issuer, and Audience Verification

**Use when**

Configuring OpenID Connect and SmallRye JWT authentication to validate bearer tokens and session tokens securely.

**Secure rules**

**Rule 1: Validate token signatures, algorithms, issuers, and audiences explicitly before accepting identity**

Ensure that `mp.jwt.verify.issuer` is set to the exact expected issuer string and `mp.jwt.verify.publickey.location` points to the valid public key PEM file. Configure exact expected issuer and audience properties instead of using wildcards like `any` to prevent accepting tokens from untrusted issuers or other applications.

```properties
mp.jwt.verify.publickey.location=publicKey.pem
mp.jwt.verify.issuer=https://example.com/issuer
mp.jwt.verify.audiences=my-service-client-id
quarkus.oidc.token.issuer=https://auth.example.com/realms/main
quarkus.oidc.token.audience=my-service-client-id
```

**Rule 2: Configure remote token introspection for opaque bearer tokens lacking digital signatures.**

When processing opaque tokens, define `quarkus.oidc.introspection-path` or enable discovery via `quarkus.oidc.discovery-enabled=true` so that tokens are verified remotely.

```properties
quarkus.oidc.auth-server-url=https://auth.example.com/auth/realms/main
quarkus.oidc.discovery-enabled=false
quarkus.oidc.introspection-path=/protocol/openid-connect/token/introspect
```

**Rule 3: Verify JWT token certificate chains correctly**

Ensure X.509 certificate chains embedded in JWT `x5c` headers are ordered leaf-first, validate to a trusted root, and verify the token signature with the leaf certificate's public key. Trust the leaf certificate directly or configure its expected name.

```properties
quarkus.oidc.certificate-chain.trust-store-file=truststore.p12
quarkus.oidc.certificate-chain.trust-store-password=secret
quarkus.oidc.certificate-chain.leaf-certificate-name=www.example.com
```


### Verify Passwords and Configure Credential Verifiers for Authentication

**Use when**

Setting up password-based authentication and database or custom identity providers in Quarkus.

**Secure rules**

**Rule 1: Configure JDBC principal queries with explicit 1-based index mapping and secure password verification.**

Configure `elytron-security-jdbc` using a parameterized SQL statement with bcrypt password mapping and accurate 1-based column index mappings for user role attributes.

```properties
quarkus.security.jdbc.enabled=true
quarkus.security.jdbc.principal-query.sql=SELECT u.password, u.role FROM test_user u WHERE u.username=?
quarkus.security.jdbc.principal-query.bcrypt-password-mapper.enabled=true
quarkus.security.jdbc.principal-query.bcrypt-password-mapper.password-index=1
quarkus.security.jdbc.principal-query.attribute-mappings.0.index=2
quarkus.security.jdbc.principal-query.attribute-mappings.0.to=groups
```

**Rule 2: Delegate authentication logic to `IdentityProviderManager` in custom authentication mechanisms.**

When creating a custom `HttpAuthenticationMechanism`, delegate authentication to `IdentityProviderManager` rather than validating credentials inline to ensure consistent identity handling across mechanisms.

```java
@Alternative
@Priority(1)
@ApplicationScoped
public class CustomAuthMechanism implements HttpAuthenticationMechanism {
    @Inject
    JWTAuthMechanism delegate;

    @Override
    public Uni<SecurityIdentity> authenticate(RoutingContext context, IdentityProviderManager identityProviderManager) {
        return delegate.authenticate(context, identityProviderManager);
    }
}
```
