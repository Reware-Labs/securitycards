# Security cards

Repository: `https://github.com/keycloak/keycloak#26.7.0`
Category: authentication

## authentication

### Enforce Multi-Factor Authentication and Robust Password Credential Policies

**Use when**

Setting up user credential policies, password hashing, brute-force protection, and authentication flows requiring secondary or multi-factor verification.

**Secure rules**

**Rule 1: Configure robust password hashing parameters and enable brute-force protection in realm representations.**

Specify strong password hashing algorithms like `argon2` with adequate parameters and explicitly set `bruteForceProtected` to true in realm configurations to prevent offline cracking and automated guessing attacks.

```json
{
  "realm": "my-realm",
  "bruteForceProtected": true,
  "failureFactor": 5,
  "maxFailureWaitSeconds": 900,
  "minimumQuickLoginWaitSeconds": 60,
  "waitIncrementSeconds": 60
}
```

**Rule 2: Supply valid multi-factor authentication tokens and require primary credential factors prior to secondary checks.**

When executing direct access password grants or authentication flows for MFA-enabled accounts, supply current time-based OTP credentials and structure flows so that primary 1st-factor credentials are required before secondary factor evaluations.

```java
AccessTokenResponse response = oauth.passwordGrantRequest("username", "password")
        .otp(currentTotpCode)
        .send();

if (response.getStatusCode() == 400 && "invalid_grant".equals(response.getError())) {
    // Handle invalid OTP token
}
```


### Validate Client Assertions and Configure Strong Authentication for Confidential Clients

**Use when**

Configuring client authentication mechanisms, signing algorithms, and token exchange verification for confidential or public OAuth2 clients.

**Secure rules**

**Rule 1: Enforce strong asymmetric or signed JWT client authentication methods and strict validation checks at the token endpoint.**

Configure confidential clients with valid client credentials and explicit algorithms such as `RS256` for signed JWTs via `token_endpoint_auth_signing_alg`. Ensure client assertions include a single audience matching Keycloak's issuer URL and a short expiration window.

```java
ClientRepresentation client = new ClientRepresentation();
client.setClientId("resource-server-test");
client.setClientAuthenticatorType(JWTClientAuthenticator.PROVIDER_ID);
client.getAttributes().put(OIDCConfigAttributes.TOKEN_ENDPOINT_AUTH_SIGNING_ALG, "RS256");
client.getAttributes().put(JWTClientAuthenticator.CERTIFICATE_ATTR, "<PEM_ENCODED_CERTIFICATE>");
```

**Rule 2: Require mutual TLS holder-of-key binding and prove possession for sender-constrained tokens.**

Enable `useMtlsHokToken` on confidential client configuration wrappers to verify that request client certificates match the thumbprint bound to tokens, and provide valid proof of possession when exchanging sender-constrained subject tokens.

```java
OIDCAdvancedConfigWrapper config = OIDCAdvancedConfigWrapper.fromClientModel(client);
config.setUseMtlsHokToken(true);
```


### Validate OpenID Connect Tokens and Enforce Fresh User Authentication

**Use when**

Requesting OIDC tokens, validating signatures and claims from external identity providers, or enforcing fresh authentication sessions.

**Secure rules**

**Rule 1: Validate external token signatures and retain required OIDC scopes during identity brokering.**

Ensure OIDC Identity Provider configurations retain the mandatory `openid` scope and enforce signature validation on incoming external tokens.

```java
OIDCIdentityProviderConfig config = new OIDCIdentityProviderConfig();
config.setDefaultScope("openid profile email");
config.setValidateSignature(true);
```

**Rule 2: Force fresh user authentication using `max_age` or `prompt=login` parameters.**

Supply parameters like `prompt=login` or a restrictive `max_age` in OIDC authorization requests when applications require fresh credentials or step-up authentication.

```java
String authUrl = KeycloakUriBuilder.fromUri(authServerUrl)
    .path("/realms/{realm-name}/protocol/openid-connect/auth")
    .queryParam("client_id", "my-client")
    .queryParam("response_type", "code")
    .queryParam("scope", "openid")
    .queryParam("redirect_uri", redirectUri)
    .queryParam("prompt", "login")
    .build("my-realm")
    .toString();
```
