# Security blueprint

Repository: `https://github.com/symfony/symfony#v8.1.1`

## Security posture

The security posture for Symfony applications relies on defense-in-depth across authentication firewalls, access control maps, session lifecycles, and request validation boundaries. The framework protects routing, CSRF tokens, and password hashing by default, but developers must explicitly configure access rules, session fixation defenses, trusted network boundaries, and credential extraction channels. Security-sensitive surfaces include authentication listeners, authorization voters, persistent cookies, file upload endpoints, and framework secret stores, where improper configuration or missing validation can lead to unauthorized access, enumeration, or session hijacking.

## Essential implementation rules

1. **Configure Access Control Maps and Path Rules Securely**

Explicitly set `allow_if_all_abstain` to `false` in security configuration, write path patterns using URL-decoded characters, and enforce HTTPS transport channels and method boundaries for protected routes.

2. **Construct and Evaluate Security Expressions and Voters Safely**

Distinguish full authentication from remember-me using `is_fully_authenticated()`, build security expressions using hardcoded logic strings, and wrap expression strings in `Expression` objects before authorization checks.

3. **Enforce Controller and Method Authorization Checks**

Perform explicit authorization checks in controller actions using `denyAccessUnlessGranted()` or `isGranted()`, protect user impersonation privileges, and align subject parameter names in `#[IsGranted]` attributes.

4. **Mitigate Authentication Enumeration and Enable Throttling**

Mask authentication failure details by configuring `AuthenticatorManager` with `ExposeSecurityLevel::None` to prevent user enumeration, and enable login throttling on firewalls to protect against brute-force attacks.

5. **Enforce Strict Credential Extraction and HTTP Method Restrictions**

Extract access tokens only from the HTTP Authorization header rather than query strings or request bodies, keep `post_only: true` for form logins, and handle authentication failures explicitly in custom authenticators.

6. **Secure Persistent Sessions and Handle Token Theft**

Include credential properties like `password` in remember-me `signature_properties`, store persistent tokens server-side, and catch `CookieTheftException` to invalidate compromised token series.

7. **Verify Cryptographic Signatures and Configure OIDC Handlers**

Configure OIDC access token handlers with explicit signature algorithms and `JWKSet` services, and enforce usage limits and cryptographic validation on signature hashes and login links.

8. **Enforce Request Middleware Boundaries and Short-Circuiting**

Restrict forward paths in authentication failure handling middleware using static configuration, and mark requests as stateless (`_stateless => true`) during stateless middleware authentication failures.

9. **Hash Passwords Using UserPasswordHasherInterface**

Always use Symfony's configured `UserPasswordHasherInterface` to hash user passwords, and verify user inputs using supported validators and account status checks.

10. **Enable Framework CSRF Protection and Token Validation**

Ensure `framework.csrf_protection` is enabled in configuration and validate submitted tokens with constant-time comparison methods using `isCsrfTokenValid()` or `CsrfTokenManagerInterface::isTokenValid()`.

11. **Sanitize File Paths and Isolate Uploads**

Sanitize input filenames using `basename()` when serving files through `AbstractController`'s `file()` helper to prevent path traversal, and rely on attachment disposition to prevent arbitrary execution.

12. **Use Query Placeholders for LDAP Searches**

Pass search query templates containing placeholders like `{user_identifier}` to `LdapBadge` to ensure user identifiers are safely escaped using `LdapInterface::ESCAPE_FILTER` automatically.

13. **Enforce Strict String Types on Authentication Parameters**

Rely on `FormLoginAuthenticator` to reject invalid types like arrays or objects on inputs such as `_username` and `_password` with a `BadRequestHttpException`, and ensure empty strings trigger a `BadCredentialsException`.

14. **Configure Trusted Proxies and Hosts for Network Boundaries**

Explicitly specify valid patterns in `trusted_hosts`, specific IP ranges in `trusted_proxies`, and valid header names in `trusted_headers` to prevent HTTP Host header attacks and client IP spoofing.

15. **Escape Username Output and Disable Profilers in Production**

Apply context-appropriate output encoding to `AuthenticationUtils::getLastUsername()` values before rendering them in HTML templates, and disable `WebProfilerBundle` and debugging features in production.

16. **Protect Application Secrets and Encryption Keys**

Populate `framework.secret` using a strong environment variable, and exclude private decryption key files from version control and public web directories.

17. **Configure Session Fixation Protection and Secure Cookies**

Keep `session_fixation_strategy` set to `migrate` or `invalidate`, and configure session and remember-me cookies to enforce HTTPS, `httponly: true`, and appropriate `samesite` directives.
