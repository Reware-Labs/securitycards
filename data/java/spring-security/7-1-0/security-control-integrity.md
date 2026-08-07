# Security cards

Repository: `https://github.com/spring-projects/spring-security#7.1.0`
Category: security control integrity

## security control integrity

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
