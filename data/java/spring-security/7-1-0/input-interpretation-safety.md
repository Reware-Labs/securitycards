# Security cards

Repository: `https://github.com/spring-projects/spring-security#7.1.0`
Category: input interpretation safety

## input interpretation safety

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
