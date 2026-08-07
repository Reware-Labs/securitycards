# Security cards

Repository: `https://github.com/keycloak/keycloak#26.7.0`
Category: boundary control

## boundary control

### Validate Redirect URI Match During Token Exchange

**Use when**

Exchanging an authorization code for an access token at the server boundary where request parameters cross into state validation.

**Secure rules**

**Rule 1: Ensure the redirect URI submitted in the token request matches the redirect URI used during the initial authorization request.**

Keycloak strictly validates that the `redirect_uri` sent during the token exchange matches the one used in the initial authorization request. Developers must ensure that the client application sends the exact matching redirect URI in both the authorization request and the subsequent token request to prevent authorization code leakage and request redirection attacks at the token endpoint boundary.

```java
String originalRedirectUri = "https://app.example.com/oauth/callback";
oauth.redirectUri(originalRedirectUri);

// Token request uses the same redirectUri
AccessTokenResponse response = oauth.doAccessTokenRequest(code);
```
