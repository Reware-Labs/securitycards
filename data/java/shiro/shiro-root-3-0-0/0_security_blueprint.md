# Security blueprint

Repository: `https://github.com/apache/shiro#shiro-root-3.0.0`

## Security posture

Developers working with Apache Shiro must assume a strict defense-in-depth posture where authorization checks, credential validation, cryptographic operations, and session boundaries are explicitly configured and managed. While Shiro provides robust default components for authentication, session handling, and access control, misconfigurations such as missing fail-closed realms, unhandled assertion exceptions, or disabled security flags will lead to severe access bypasses and session vulnerabilities. All sensitive operations, authentication states, and cryptographic storage keys must be rigorously managed, validated, and hardened against injection, deserialization, and timing attacks.

## Essential implementation rules

1. **Enforce Explicit Authorization Checks and Fail-Closed Realms**

Use explicit assertion methods like `checkPermission` or `checkRole` on the `Subject` instance to enforce authorization barriers, and ensure custom `AuthorizingRealm` implementations return `null` from `doGetAuthorizationInfo` to enforce fail-closed access control when principals are missing or unmapped.

2. **Use Strong Cryptographic Hashing and Secure Credential Verification**

Configure `PasswordMatcher` with `DefaultPasswordService` and use `HashedCredentialsMatcher` with strong algorithms like SHA-256 and appropriate iterations. Always generate and store cryptographically strong random per-user salts using `SecureRandomNumberGenerator` and `SimpleAuthenticationInfo`.

3. **Secure Session Management and Persistent Storage Configuration**

Enable HttpOnly, Secure, and SameSite cookie attributes, disable session ID URL rewriting (`sessionIdUrlRewritingEnabled = false`), and configure a persistent `SessionDAO` along with `deleteInvalidSessions = true` on `DefaultSessionManager` to prevent session fixation and resource exhaustion.

4. **Mitigate Username Enumeration and Timing Attacks**

Override `createSimulatedCredentials()` in custom `CredentialsMatcher` implementations to execute dummy hashing for non-existent accounts, and handle authentication failures generically to avoid revealing whether usernames exist.

5. **Prevent Deserialization and Cryptographic Misconfigurations**

Configure `AbstractRememberMeManager` with a hardened serializer using `setSerializer` to perform strict class filtering, explicitly set a persistent symmetric cipher key via `setCipherKey`, and maintain auto-generated initialization vectors without using ECB mode.

6. **Protect State-Changing Operations Against Cross-Site Request Forgery**

Enable `postOnlyLogout` on `LogoutFilter` so that non-POST requests receive an HTTP 405 Method Not Allowed response and state-changing logout actions are protected against Cross-Site Request Forgery and link prefetching.

7. **Use Parameterized Queries in Custom Realms and Validate Format Identifiers**

Ensure custom `JdbcRealm` SQL statements use JDBC parameter placeholders `?` instead of dynamic string concatenation, and validate untrusted format identifiers against an explicit allowlist or registered mappings before passing them to hash format factories.

8. **Preserve Global Filters and Retain Security Boundaries**

Retain critical global security filters such as `InvalidRequestFilter` when overriding global filter chains, maintain complete path protection rules when defining custom web beans, and explicitly bind or execute programmatic Subject operations using `Subject.execute()`.
