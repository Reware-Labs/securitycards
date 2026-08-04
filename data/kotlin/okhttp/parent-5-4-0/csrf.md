# Security cards

Repository: `https://github.com/lysine-dev/okhttp#parent-5.4.0`
Category: csrf

## csrf

### Validate state tokens to prevent CSRF in OAuth authorization flows

**Use when**

Initiating OAuth 2.0 authorization flows and handling callbacks in network client applications.

**Secure rules**

**Rule 1: Generate a cryptographically random, unguessable state token for each authorization request and validate it upon receiving the callback.**

Use `SecureRandom` to create an unpredictable state token for every outgoing request and verify the corresponding parameter during the callback processing to prevent cross-site request forgery.

```java
private ByteString generateStateToken() {
  byte[] bytes = new byte[16];
  secureRandom.nextBytes(bytes);
  return ByteString.of(bytes);
}

HttpUrl authorizeUrl = slackApi.authorizeUrl(scopes, redirectUrl, generateStateToken(), team);
```
