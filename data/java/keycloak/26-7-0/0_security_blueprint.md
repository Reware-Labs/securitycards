# Security blueprint

Repository: `https://github.com/keycloak/keycloak#26.7.0`

## Security posture

Keycloak provides a comprehensive IAM framework that protects authentication flows, token issuance, and administrative realms by default, but relies heavily on correct configuration and strict transport rules to prevent security bypasses. Developers must treat all endpoints, realm configurations, and client authentication boundaries as highly sensitive, ensuring that security controls fail closed when encountering malformed payloads, unverified tokens, or unassigned roles. Unauthenticated requests, misconfigured signature algorithms, and weak session parameters will expose the library and its managed clients to privilege escalation, session fixation, and token reuse attacks.

## Essential implementation rules

1. **Assign Least Privilege Roles and Enforce Strict Policy Enforcement**

Scope management roles down to minimal required functions and explicitly set `policyEnforcementMode` to `ENFORCING` on authorization-enabled clients to deny requests by default unless explicitly granted.

2. **Restrict Token Exchange and Disable Full Scopeing**

Configure fine-grained admin authorization policies to restrict token exchange execution to authorized confidential clients, and set `fullScopeAllowed` to `false` on client configurations.

3. **Match Credential Body Types to Signer APIs**

Pass correctly formatted credential body objects such as `SdJwtCredentialBody` to the corresponding signer API to prevent validation failures and unhashed disclosures.

4. **Enforce Robust Password Hashing and Brute-Force Protection**

Specify strong password hashing algorithms like `argon2` or `pbkdf2-sha512` with adequate iteration counts and explicitly enable brute-force protection in realm configurations.

5. **Require Strong Client Authentication and Cryptographic Token Verification**

Configure confidential clients with valid client credentials, enforce explicit asymmetric signature algorithms like `RS256` or `PS256`, disallow the `none` algorithm, and enable mutual TLS holder-of-key binding.

6. **Validate OpenID Connect Tokens and Redirect URIs**

Validate external token signatures, retain mandatory `openid` scopes, enforce fresh authentication sessions using `prompt=login` or `max_age`, and ensure token exchange request redirect URIs strictly match original authorization requests.

7. **Validate Configuration Integrity and Environment Secrets**

Ensure realm import attributes and brute-force lockouts contain non-negative integers, use environment-variable placeholders like `${ENVIRONMENT_VARIABLE}` for secrets, and store database passwords securely via configuration files or raw environment variables.

8. **Enforce Strict Cryptographic Algorithms and Payload Limits**

Enforce strong signature algorithms like `RSA_SHA256` for SAML, use authenticated encryption such as `XMLCipher.AES_256_GCM`, and bound SAML inflation limits to prevent decompression bombs.

9. **Validate Input Parameters and Endpoint Request Framing**

Define explicit parameter types and strict regular expressions for parameterized scopes, configure upper bounds on request parameter lengths, disable unmanaged attributes, and reject duplicate access token submission mechanisms on protocol endpoints.

10. **Enforce Transport Security and Trusted Proxy Configuration**

Set `sslRequired` on realms to `external` or `all` to enforce HTTPS transport, specify trusted reverse proxy IP addresses using `proxy-trusted-addresses`, and configure production-grade relational databases instead of embedded development databases.

11. **Manage Strict Session Lifespans and Revocation**

Explicitly define `ssoSessionIdleTimeout` and `ssoSessionMaxLifespan` parameters, validate active session status using `AuthenticationManager.isSessionValid`, perform backchannel logouts, and set refresh token reuse limits to zero to prevent replay attacks.
