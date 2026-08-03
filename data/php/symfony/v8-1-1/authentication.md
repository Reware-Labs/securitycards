# Security cards

Repository: `https://github.com/symfony/symfony#v8.1.1`
Category: authentication

## authentication

### Configure Security Error Exposure and Rate Limiting to Prevent Enumeration

**Use when**

Hardening authentication endpoints against brute-force attacks and account enumeration.

**Secure rules**

**Rule 1: Mask authentication failure details to prevent user enumeration.**

Configure `AuthenticatorManager` with `ExposeSecurityLevel::None` to convert internal exceptions like `UserNotFoundException` into a generic `BadCredentialsException`, preventing attackers from discovering valid usernames.

```php
use Symfony\Component\Security\Http\Authentication\AuthenticatorManager;
use Symfony\Component\Security\Http\Authentication\ExposeSecurityLevel;

$manager = new AuthenticatorManager(
    $authenticators,
    $tokenStorage,
    $eventDispatcher,
    'main',
    requiredBadges: [],
    exposeSecurityErrors: ExposeSecurityLevel::None
);
```

**Rule 2: Enable login throttling on firewalls to protect against brute force attacks.**

Configure login throttling using `LoginThrottlingListener` within firewall settings to limit failed login attempts and protect authentication endpoints against credential stuffing.

```yaml
security:
    firewalls:
        main:
            login_throttling:
                max_attempts: 5
                interval: '1 minute'
```


### Enforce Password Verification, Hash Upgrades, and Account Status Checks

**Use when**

Verifying user passwords, handling user session refresh, or managing credential upgrades.

**Secure rules**

**Rule 1: Verify user passwords using supported verifiers and enforce non-empty password checks.**

Ensure user models implement `PasswordAuthenticatedUserInterface` and return valid non-null password hashes. Utilize standard password credentials and user password constraints to reject empty inputs and prevent authentication bypasses.

```php
use Symfony\Component\Security\Core\Validator\Constraints\UserPassword;

class ChangePasswordModel
{
    #[UserPassword(message: 'Your current password is invalid.')]
    public string $currentPassword = '';
}
```

**Rule 2: Ensure user providers validate user existence and account status during session refresh.**

Implement `UserProviderInterface` methods like `refreshUser()` to strictly check user existence and status, throwing `UserNotFoundException` or `UnsupportedUserException` to deauthenticate deleted or blocked accounts.

```php
public function refreshUser(UserInterface $user): UserInterface
{
    $reloadedUser = $this->findUserByIdentifier($user->getUserIdentifier());
    if (!$reloadedUser) {
        throw new UserNotFoundException(sprintf('User "%s" not found.', $user->getUserIdentifier()));
    }
    return $reloadedUser;
}
```


### Enforce Strict Credential Extraction and HTTP Method Restrictions

**Use when**

Configuring authentication firewalls or custom authenticators to accept credentials via HTTP request parameters or headers.

**Secure rules**

**Rule 1: Prefer HTTP Authorization headers for access-token extraction and restrict form-login credentials to POST request bodies**

Configure the access-token authenticator to extract tokens only from the HTTP Authorization header (the default and recommended extractor). Official documentation and the extractor implementations warn that the `query_string` and `request_body` extractors SHOULD NOT be used unless it is impossible to send the token in a header, because URLs and request bodies containing tokens are likely to be logged. For form-based login, keep the default `post_only: true` setting so that credentials are accepted only from POST request bodies and never from query strings.

```yaml
security:
    firewalls:
        api:
            stateless: true
            access_token:
                token_handler: App\Security\AccessTokenHandler
                token_extractors: 'header'
```

**Rule 2: Handle authentication failures explicitly in custom authenticators**

When implementing `AuthenticatorInterface`, return an explicit HTTP Response from `onAuthenticationFailure` rather than `null`. Returning `null` allows the request to continue with an unauthenticated user, which is usually undesirable.

```php
public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
{
    $data = [
        // you may want to customize or obfuscate the message first
        'message' => strtr($exception->getMessageKey(), $exception->getMessageData())
        // or to translate this message
        // $this->translator->trans($exception->getMessageKey(), $exception->getMessageData())
    ];

    return new JsonResponse($data, Response::HTTP_UNAUTHORIZED);
}
```


### Secure Persistent Sessions and Remember-Me Handlers

**Use when**

Configuring persistent remember-me authentication, cookie consumption, or token rotation.

**Secure rules**

**Rule 1: Include credential properties in remember-me signatures and enforce token rotation.**

Include security-sensitive user properties like `password` in `signature_properties` to ensure credential changes invalidate active remember-me cookies. Custom remember-me handlers must enforce token rotation and throw `CookieTheftException` upon unexpected cookie usage.

```yaml
security:
    firewalls:
        main:
            remember_me:
                secret: '%kernel.secret%'
                signature_properties: ['password', 'userIdentifier']
```

**Rule 2: Store persistent remember-me tokens server-side and perform timing-safe comparisons.**

Configure DoctrineTokenProvider to store persistent remember-me tokens securely in database storage rather than client cookies, and use timing-safe functions like `hash_equals()` in custom token verifiers.

```php
final class SecureTokenVerifier implements TokenVerifierInterface
{
    public function verifyToken(PersistentTokenInterface $token, string $tokenValue): bool
    {
        return hash_equals($token->getTokenValue(), $tokenValue);
    }
}
```


### Verify Cryptographic Signatures and Configure OIDC Token Handlers Securely

**Use when**

Validating JWT, OpenID Connect (OIDC), or signature-based authentication tokens.

**Secure rules**

**Rule 1: Specify permitted signature algorithms and use JWKSet services for OIDC token verification.**

Configure OIDC access token handlers with explicit signature algorithms and utilize `JWKSet` services instead of deprecated single JWK configurations to support seamless key rotation by identity providers.

```yaml
security:
    firewalls:
        api:
            access_token:
                token_handler:
                    oidc:
                        algorithms: ['RS256', 'ES256']
                        issuers: ['https://auth.example.com']
                        audience: 'api_audience'
                        keyset: '%env(OIDC_JWKSET)%'
```

**Rule 2: Enforce usage limits and cryptographic validation on signature hashes and login links.**

Inject `ExpiredSignatureStorage` and specify `$maxUses` when initializing `SignatureHasher` or configuring login link authentication to mitigate replay attacks and enforce single-use semantics.

```php
$hasher = new SignatureHasher(
    $propertyAccessor,
    ['password'],
    $secret,
    $expiredSignatureStorage,
    maxUses: 1
);
$hasher->verifySignatureHash($user, $expires, $hash);
```
