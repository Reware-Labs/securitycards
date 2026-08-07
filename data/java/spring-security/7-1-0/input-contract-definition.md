# Security cards

Repository: `https://github.com/spring-projects/spring-security#7.1.0`
Category: input contract definition

## input contract definition

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
