# Security cards

Repository: `https://github.com/spring-projects/spring-security#7.1.0`
Category: authentication

## authentication

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
