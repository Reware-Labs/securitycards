# Security cards

Repository: `https://github.com/keycloak/keycloak#26.7.0`

## Category: access control

### Enforce Least Privilege and Scoped Authorization Policies for Administrative Operations

**Use when**

When developers and administrators are configuring permissions, assigning roles, or managing client access to ensure users and services only have access to required resources.

**Secure rules**

**Rule 1: Assign explicit fine-grained management permissions and roles instead of full administrative privileges.**

Scope management roles down to minimal required functions and restrict broad permissions like `manage-realm` to prevent unrestricted control over realm settings.

```json
"groups": [
  {
    "name": "DUA",
    "clientRoles": {
      "realm-management": ["query-groups", "query-clients", "query-users"]
    }
  }
]
```

**Rule 2: Enable policy enforcement mode to enforcing for client authorization settings.**

Ensure that `policyEnforcementMode` is explicitly configured to `ENFORCING` on authorization-enabled clients so that requests to protected resources are denied by default unless an authorization policy explicitly grants access.

```json
{
  "clientId": "test-app-authz",
  "authorizationSettings": {
    "allowRemoteResourceManagement": true,
    "policyEnforcementMode": "ENFORCING",
    "resources": [...]
  }
}
```


### Restrict Token Exchange and Client Scope Authorization Boundaries

**Use when**

When implementing OAuth2 token exchanges, configuring token grant requests, or assigning client scopes to prevent cross-client privilege escalation.

**Secure rules**

**Rule 1: Restrict token exchange execution exclusively to authorized confidential clients and target roles.**

Configure fine-grained admin authorization policies on target clients to explicitly whitelist which client IDs are permitted to invoke token exchange and enforce explicit client policy representations.

```java
ClientPolicyRepresentation exchangePolicyRep = new ClientPolicyRepresentation();
exchangePolicyRep.setName("allowed-exchangers");
exchangePolicyRep.addClient(authorizedClient.getId());
Policy policy = management.authz().getStoreFactory().getPolicyStore().create(server, exchangePolicyRep);
management.clients().exchangeToPermission(samlTargetClient).addAssociatedPolicy(policy);
```

**Rule 2: Disable full scope allowed on clients to limit token scope mappings.**

Set `fullScopeAllowed` to `false` on client configurations to ensure access tokens are limited strictly to explicitly assigned realm and client roles.

```json
{
  "clientId": "test-app-scope",
  "enabled": true,
  "fullScopeAllowed": false,
  "redirectUris": [
    "https://app.example.com/auth/callback"
  ]
}
```


## Category: api contract misuse

### Supply Matched Credential Body Types to Specific Credential Signers

**Use when**

Developing credential issuance workflows where verifiable credentials must be signed using specific credential body objects and signers.

**Secure rules**

**Rule 1: Pass correctly formatted credential body objects to the corresponding signer API.**

Ensure that you pass correctly formatted `SdJwtCredentialBody` objects to `SdJwtCredentialSigner`. Passing mismatched credential structures like Linked Data `LDCredentialBody` objects into the SD-JWT signer triggers a `CredentialSignerException` and can lead to validation failures or unhashed disclosures.

```java
SdJwtCredentialBody body = new SdJwtCredentialBuilder()
        .buildCredentialBody(verifiableCredential, credentialBuildConfig);

SdJwtCredentialSigner signer = new SdJwtCredentialSigner(session);
String signedSdJwt = signer.signCredential(body, credentialBuildConfig);
```


## Category: authentication

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


## Category: boundary control

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


## Category: configuration source integrity

### Validate configuration attribute integrity during realm import

**Use when**

When importing realm representations programmatically and configuring settings such as brute force protection attributes to ensure configuration integrity and prevent validation failures.

**Secure rules**

**Rule 1: Ensure brute force protection configuration attributes are set to non-negative integers during programmatic realm representation configuration.**

Verify that all configuration attributes like `maxTemporaryLockouts`, `maxFailureWaitSeconds`, `waitIncrementSeconds`, and `failureFactor` contain valid non-negative integer values before executing realm import operations to maintain configuration source integrity and prevent validation exceptions.

```java
RealmRepresentation rep = new RealmRepresentation();
rep.setBruteForceProtected(true);
rep.setMaxTemporaryLockouts(5);
rep.setMaxFailureWaitSeconds(900);
rep.setWaitIncrementSeconds(60);
rep.setFailureFactor(5);
```

**Rule 2: Keep the failure reset time greater than the maximum temporary lockout wait**

When configuring temporary brute-force lockouts, set Failure Reset Time greater than Max Wait. Otherwise, the failure counter resets before the lockout duration can reach the configured maximum wait.


## Category: cryptography

### Enforce Strong Signature Algorithms and Authenticated Encryption for SAML and OIDC

**Use when**

Configuring cryptographic signature algorithms, document encryption, and token verification settings for SAML and OIDC protocols.

**Secure rules**

**Rule 1: Enforce strong signature algorithms such as RSA-SHA256 instead of deprecated SHA-1 variants when signing SAML messages.**

Always explicitly configure signature algorithms to use `RSA_SHA256` or stronger digest variants when building signed SAML documents and client representations to prevent cryptographic signature forgery.

```java
BaseSAML2BindingBuilder builder = new BaseSAML2BindingBuilder()
    .signatureAlgorithm(SignatureAlgorithm.RSA_SHA256)
    .signWith(keyName, keyPair, cert)
    .signDocument();
```

**Rule 2: Use authenticated encryption algorithms like AES-GCM for SAML document encryption.**

Configure SAML encryption directly using authenticated encryption algorithms such as `XMLCipher.AES_256_GCM` rather than legacy or unauthenticated encryption modes to ensure message confidentiality and integrity.

```java
BaseSAML2BindingBuilder builder = new BaseSAML2BindingBuilder()
    .encryptionAlgorithm(org.apache.xml.security.encryption.XMLCipher.AES_256_GCM)
    .encrypt(recipientPublicKey);
```

**Rule 3: Require signed and encrypted UserInfo responses for sensitive OIDC claims.**

Configure OIDC client representation settings to enforce JWS signing and JWE encryption algorithms for UserInfo responses containing sensitive personally identifiable information.

```java
ClientResource clientResource = realm.clients().get(clientUuid);
ClientRepresentation clientRep = clientResource.toRepresentation();

OIDCAdvancedConfigWrapper config = OIDCAdvancedConfigWrapper.fromClientRepresentation(clientRep);
config.setUserInfoSignedResponseAlg("PS256");
config.setUserInfoEncryptedResponseAlg("RSA-OAEP-256");
config.setUserInfoEncryptedResponseEnc("A256GCM");
config.setUseJwksUrl(true);
config.setJwksUrl("https://client.example.com/jwks.json");

clientResource.update(clientRep);
```

**Rule 4: Enforce strict signature verification by disallowing the 'none' algorithm on client JWT decoding.**

When decoding client JWTs using TokenManager, explicitly set `allowNoneAlgorithm` to `false` to prevent unsigned tokens from bypassing cryptographic verification.

```java
MyTokenRepresentation token = tokenManager.decodeClientJWT(
    jwtString,
    clientModel,
    (jose, client) -> {
        // Perform required header/claim assertions
    },
    MyTokenRepresentation.class,
    false // Do not allow 'none' algorithm
);
```


### Maintain Robust Password Hashing Policies

**Use when**

Configuring realm password hashing algorithms and iteration counts to protect stored credentials against offline brute-force attacks.

**Secure rules**

**Rule 1: Maintain OWASP-aligned password hashing algorithms and iteration counts.**

Use `pbkdf2-sha512` as the default password hashing algorithm with strong iteration counts and avoid lowering iteration counts or using weaker digest algorithms in realm password policies.


## Category: input contract definition

### Enforce Strict Parameter Types and Length Limits on Request Parameters and Attributes

**Use when**

When defining parameterized scopes, configuring user profile attributes, or setting OIDC token endpoint request parameter constraints in Keycloak.

**Secure rules**

**Rule 1: Define explicit parameter types and strict regular expressions for all parameterized scope definitions.**

When defining parameterized scopes in client settings, select a concrete built-in parameter type or set a custom parameter type with a strict regular expression to enforce request-time parameter validation before issuing tokens.

**Rule 2: Configure upper bounds on incoming OIDC standard request parameter lengths.**

Set parameter length restrictions in `conf/keycloak.conf` or via command-line arguments such as `req-params-default-max-size` and `spi-login-protocol-openid-connect-req-params-max-size-login-hint` to prevent excessive memory pressure or input interpretation behavior.

```bash
req-params-default-max-size=4000
spi-login-protocol-openid-connect-req-params-max-size-login-hint=255
```

**Rule 3: Disable unmanaged attributes and enforce strict length validations on managed user profile attributes.**

In the Keycloak Admin Console, disable unmanaged attributes or restrict them to administrators, and configure strict length restrictions using the validator configuration JSON for user profile attributes.

```json
{
  "name": "customAttribute",
  "validations": {
    "length": {
      "max": 255
    }
  }
}
```


## Category: input driven boundary selection

### Enforce Explicit URI Matching for Wildcard Resource Decision Evaluation

**Use when**

When querying decision evaluation endpoints for resources defined with wildcard URIs in Keycloak authorization requests.

**Secure rules**

**Rule 1: Enable explicit URI matching when evaluating decision requests for resources defined with wildcard URIs.**

When querying decision evaluation endpoints for resources defined with wildcard URIs such as `/rs/*`, ensure that the `matchingUri` flag is explicitly set to `true` to enable proper URI matching against wildcard patterns.

```java
AuthorizationResponse response = authorizeDecision(accessToken, true,
    new PermissionRequest("/rs/data", "ScopeD", "ScopeE"));
assertTrue((Boolean) response.getOtherClaims().getOrDefault("result", false));
```


## Category: input interpretation safety

### Register Authorization Detail Parsers for OID4VC Rich Authorization Requests

**Use when**

When implementing OAuth 2.0 or OID4VC credential issuance workflows requiring parsing and validation of Rich Authorization Requests.

**Secure rules**

**Rule 1: Register the dedicated authorization detail parser for OID4VC requests.**

Register `OID4VCAuthorizationDetailsParser` with `AuthorizationDetailsParser` under the `openid_credential` type to ensure incoming authorization detail objects are correctly parsed and validated during OID4VC credential issuance.

```java
AuthorizationDetailsParser.registerParser(
    OID4VCConstants.OPENID_CREDENTIAL,
    new OID4VCAuthorizationDetailsParser()
);
```


## Category: interface protocol hardening

### Enforce Strict Parameter, Framing, and Method Constraints on Protocol Endpoints

**Use when**

Developing or configuring client integrations and protocol endpoints in Keycloak to prevent parameter pollution, cross-interface abuse, and request smuggling.

**Secure rules**

**Rule 1: Reject duplicate access token submission mechanisms and conflicting request framing parameters on endpoint requests.**

When querying protocol endpoints such as UserInfo, ensure access tokens are transmitted through exactly one transport mechanism, such as the `Authorization` header, and avoid combining multiple submission methods or duplicating parameters to prevent HTTP Parameter Pollution and request confusion.

```http
GET /realms/demo/protocol/openid-connect/userinfo HTTP/1.1
Host: keycloak.example.com
Authorization: Bearer <access_token>
```


## Category: network boundary

### Enforce Strict TLS Transport Security and Trusted Proxy Configuration

**Use when**

Configuring transport security, reverse proxy headers, and trusted proxy addresses for Keycloak realms, administration, and inter-node communication.

**Secure rules**

**Rule 1: Enforce HTTPS transport requirements for Keycloak realms and administrative connections.**

Set the `sslRequired` directive on Keycloak realms to `external` or `all` to enforce HTTPS for all incoming requests. Ensure administrative CLI and REST API connections strictly target `https:` endpoints.

```yaml
apiVersion: k8s.keycloak.org/v2alpha1
kind: KeycloakRealmImport
metadata:
  name: example-realm-import
spec:
  realm:
    realm: token-test
    sslRequired: external
```

**Rule 2: Configure trusted proxy addresses and proxy headers securely.**

Specify trusted reverse proxy IP addresses using `proxy-trusted-addresses` and ensure reverse proxies overwrite incoming forwarding headers before requests reach Keycloak.

```properties
proxy-trusted-addresses=10.0.0.1,10.0.0.2
```


## Category: resource exhaustion

### Enforce maximum payload inflation size limits for SAML messages

**Use when**

Parsing incoming deflated SAML HTTP-Redirect or POST bindings in Keycloak endpoints and adapters to prevent decompression bombs.

**Secure rules**

**Rule 1: Retain bounded decompression for SAML Redirect Binding messages**

Keep Keycloak's default 128 KB inflation limit unless larger legitimate SAML messages require a carefully selected higher bound. For the Keycloak server, configure the limit with the SAML login-protocol provider option; the `org.keycloak.adapters.saml.maxInflatingSize` system property applies specifically to the SAML Galleon feature pack on WildFly or EAP.

```bash
bin/kc.sh start --spi-login-protocol--saml--max-inflating-size=524288
```


## Category: runtime environment hardening

### Configure Production Database and Disable Development Mode

**Use when**

Configuring Keycloak for production deployment to replace volatile or development environments with production-grade backends.

**Secure rules**

**Rule 1: Specify a supported production-grade relational database instead of using the embedded development database.**

Replace the default embedded `dev-file` database with a supported production-grade relational database such as PostgreSQL, MySQL, Oracle, or Microsoft SQL Server prior to deploying Keycloak to production environments. Define the database vendor and connection details inside `conf/keycloak.conf` or during build configurations.

```properties
db=postgres
db-url-host=postgres.prod.internal
db-username=keycloak
```


## Category: secret handling

### Protect Stored CLI Configuration and Secrets in Local Environments

**Use when**

When running Admin CLI commands or configuring local tool sessions that generate configuration files containing active tokens.

**Secure rules**

**Rule 1: Keep Client Registration CLI configuration private or avoid persisting it**

Do not make `~/.keycloak/kcreg.config` visible to other system users because it contains access tokens and secrets. To avoid storing these credentials in a configuration file, use `--no-config` with every `kcreg` command and provide the required authentication information on each invocation.

```bash
kcreg.sh create --no-config -s clientId=myclient -t "$INITIAL_TOKEN"
```


### Secure Secrets in Configuration Files and Realm Exports

**Use when**

When managing realm configurations, import files, client settings, and database parameters without exposing plaintext credentials.

**Secure rules**

**Rule 1: Use environment-variable placeholders for secrets in maintained realm import files**

Do not place literal production secrets in realm configuration files maintained in source control. Use Keycloak’s `${ENVIRONMENT_VARIABLE}` placeholder syntax so sensitive values are supplied from the deployment environment during import.

```json
{
  "realm": "production",
  "clients": [
    {
      "clientId": "test-app",
      "secret": "${TEST_APP_CLIENT_SECRET}"
    }
  ],
  "smtpServer": {
    "host": "smtp.example.com",
    "user": "${SMTP_USER}",
    "password": "${SMTP_PASSWORD}"
  }
}
```

**Rule 2: Store database passwords securely using environment variables or configuration files instead of command-line arguments.**

Do not supply database passwords directly via CLI arguments like `--db-password`. Pass database passwords using `conf/keycloak.conf`, environment variables like `KC_DB_PASSWORD`, or `KCRAW_DB_PASSWORD` when passwords contain special characters.

```bash
# conf/keycloak.conf
db-username=keycloak
db-password=your_secure_password

# Or via raw environment variable:
export KCRAW_DB_PASSWORD='p@ssword$with$symbols'
bin/kc.sh start --optimized
```


## Category: security control integrity

### Validate authentication flow binding overrides and policy evaluation modes for client configurations

**Use when**

When configuring client authentication flow overrides, defining client policies, or upgrading client configurations in Keycloak to ensure security controls remain correctly applied and do not fail open.

**Secure rules**

**Rule 1: Reference authentication flows that exist in the target realm**

When setting client authentication-flow binding overrides, use flow IDs that resolve to authentication flows in the client’s realm. Keycloak rejects client creation or updates when a non-empty override references an unresolved flow ID.

**Rule 2: Configure client policies with strict evaluation mode when all conditions associated with a policy must explicitly evaluate to true.**

By default, conditions returning 'abstain' are ignored during client policy evaluation. When defining critical client policies via JSON or Admin API, set the evaluation mode to `STRICT` so that all conditions must return 'yes' and none can be 'no' or 'abstain', preventing unauthorized requests from bypassing security rules.

```json
{
  "name": "strict-fapi-policy",
  "mode": "STRICT",
  "enabled": true,
  "conditions": [...],
  "profiles": ["fapi-1-advanced"]
}
```

**Rule 3: Bind custom security profiles and executors to active and enabled client policies.**

Client profiles defining security executors are only enforced when actively bound to an enabled client policy whose conditions match the target client. Always ensure that profiles containing security executors are linked to enabled policies matching target client conditions.

```java
ClientPoliciesBuilder policies = new ClientPoliciesBuilder().addPolicy(
    new ClientPolicyBuilder()
        .createPolicy("EnforceSecurityPolicy", "Enforces PKCE for clients", true)
        .addCondition(ClientRolesConditionFactory.PROVIDER_ID, createClientRolesConditionConfig(List.of("sample-client-role")))
        .addProfile("StrictSecurityProfile")
        .toRepresentation()
);
```


## Category: session management

### Manage session timeouts and revocation in Keycloak applications

**Use when**

Developing or configuring Keycloak realms, clients, and custom providers to enforce strict session lifespans, validate active session state, and perform session revocation.

**Secure rules**

**Rule 1: Configure explicit session idle and max lifespan bounds in realm settings**

Explicitly define `ssoSessionIdleTimeout` and `ssoSessionMaxLifespan` parameters in realm configuration files or models to cap session longevity and prevent unbonded session reuse.

```json
{
  "realm": "my-realm",
  "ssoSessionIdleTimeout": 1800,
  "ssoSessionMaxLifespan": 36000,
  "offlineSessionIdleTimeout": 2592000,
  "offlineSessionMaxLifespan": 5184000
}
```

**Rule 2: Validate active session status using Keycloak session validation utilities**

Use `AuthenticationManager.isSessionValid(realm, userSession)` to verify active session status before processing requests in custom providers or endpoints.

```java
if (!AuthenticationManager.isSessionValid(realm, userSession)) {
    return Response.status(Response.Status.UNAUTHORIZED).build();
}
```

**Rule 3: Trigger backchannel logout to invalidate sessions programmatically**

Use `AuthenticationManager.backchannelLogout` to perform complete session teardown, expiring identity cookies and notifying federated clients.

```java
AuthenticationManager.backchannelLogout(
    session,
    realm,
    userSession,
    uriInfo,
    clientConnection,
    requestHeaders,
    true
);
```

**Rule 4: Configure refresh token reuse limits to prevent replay attacks**

Set the maximum refresh token reuse count on the realm model to a low threshold or zero to revoke tokens immediately upon rotation.

```java
realm.setRefreshTokenMaxReuse(0);
```
