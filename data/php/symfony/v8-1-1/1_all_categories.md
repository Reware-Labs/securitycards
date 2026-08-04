# Security cards

Repository: `https://github.com/symfony/symfony#v8.1.1`

## Category: access control

### Configure Access Control Maps and Path Rules

**Use when**

When defining path rules, transport channels, HTTP methods, and access decision manager strategies in security configuration.

**Secure rules**

**Rule 1: Set allow_if_all_abstain to false in security configuration**

Explicitly set allow_if_all_abstain to false within the security access decision manager configuration to prevent unauthorized access when all voters abstain.

```yaml
security:
    access_decision_manager:
        strategy: affirmative
        allow_if_all_abstain: false
        allow_if_equal_granted_denied: false
```

**Rule 2: Write path patterns using URL-decoded characters**

Configure path patterns under `security.access_control` using raw URL-decoded characters instead of percent-encoded sequences. Symfony's `PathRequestMatcher` matches the regex against `rawurldecode($request->getPathInfo())`, so encoded sequences in the pattern will not match the decoded request path.

```yaml
security:
    access_control:
        - { path: '^/path to resource/', roles: ROLE_USER }
```

**Rule 3: Enforce HTTPS transport channels and method boundaries**

Map access rules by defining explicit path matchers, HTTP method boundaries, and required HTTPS transport channels for protected routes using `requires_channel`.

```yaml
security:
    access_control:
        - { path: ^/admin, roles: ROLE_ADMIN, requires_channel: https }
        - { path: ^/api, roles: ROLE_USER, methods: [GET, POST], requires_channel: https }
```

**Rule 4: Map explicit URL patterns to required security roles**

Ensure that sensitive request paths are explicitly mapped to required security roles or attributes in the access control configuration rather than relying solely on controller annotations.

```yaml
security:
    access_control:
        - { path: ^/admin, roles: ROLE_ADMIN }
        - { path: ^/api/v1/internal, roles: ROLE_SERVICE_ACCOUNT }
```


### Construct and Evaluate Security Expressions and Voters Safely

**Use when**

When building expression language checks, managing role prefixes, and enforcing programmatic authorization decisions.

**Secure rules**

**Rule 1: Distinguish full authentication from remember-me in expressions**

Use `is_fully_authenticated()` rather than `is_authenticated()` for sensitive operations like password changes or profile updates to ensure the user did not authenticate solely via remember-me cookies.

```php
use Symfony\Component\Security\Core\Authorization\ExpressionLanguage;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;

function verifySensitiveActionAccess(ExpressionLanguage $expressionLanguage, AuthorizationCheckerInterface $authChecker, TokenInterface $token): bool {
    $context = [
        'auth_checker' => $authChecker,
        'token' => $token,
    ];

    return (bool) $expressionLanguage->evaluate('is_fully_authenticated() and is_granted("ROLE_ADMIN")', $context);
}
```

**Rule 2: Construct security expressions using hardcoded logic strings**

Build security attributes defined as Expression objects using hardcoded logic strings rather than dynamically concatenated user input to prevent Expression Language Injection vulnerabilities.

```php
use Symfony\Component\ExpressionLanguage\Expression;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;

$expression = new Expression('user !== null and object.getOwner() === user');

if ($authorizationChecker->isGranted($expression, $document)) {

}
```

**Rule 3: Wrap security expression strings in Expression objects**

Always instantiate expression strings as `Symfony\Component\ExpressionLanguage\Expression` objects when passing them to authorization checks so that the ExpressionVoter evaluates them instead of abstaining.

```php
use Symfony\Component\ExpressionLanguage\Expression;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;

public function checkUserPermission(AuthorizationCheckerInterface $authChecker): void
{
    $expression = new Expression('is_granted("ROLE_ADMIN") or is_granted("ROLE_MANAGER")');

    if (!$authChecker->isGranted($expression)) {
        throw new AccessDeniedException('Access denied by expression voter.');
    }
}
```

**Rule 4: Enforce programmatic authorization using AccessDecisionManager**

Explicitly configure an `AccessDecisionManager` with required voters and check permissions using the `decide()` method against authentication tokens before granting access to protected code paths.

```php
use Symfony\Component\Security\Core\Authentication\AuthenticationTrustResolver;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\Security\Core\Authorization\AccessDecisionManager;
use Symfony\Component\Security\Core\Authorization\Voter\AuthenticatedVoter;
use Symfony\Component\Security\Core\Authorization\Voter\RoleVoter;
use Symfony\Component\Security\Core\Authorization\Voter\RoleHierarchyVoter;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\Security\Core\Role\RoleHierarchy;

$accessDecisionManager = new AccessDecisionManager([
    new AuthenticatedVoter(new AuthenticationTrustResolver()),
    new RoleVoter(),
    new RoleHierarchyVoter(new RoleHierarchy([
        'ROLE_ADMIN' => ['ROLE_USER'],
    ]))
]);

$token = new UsernamePasswordToken($user, 'main', $user->getRoles());

if (!$accessDecisionManager->decide($token, ['ROLE_ADMIN'])) {
    throw new AccessDeniedException();
}
```


### Enforce Controller and Method Authorization Checks

**Use when**

When implementing controller actions, handling user impersonation, or checking permissions against domain subjects and target users.

**Secure rules**

**Rule 1: Perform authorization checks in controller actions**

Use `denyAccessUnlessGranted()` or `isGranted()` in controller actions to perform authorization checks against attributes and domain subjects before executing sensitive logic.

```php
abstract class PostController extends AbstractController
{
    public function edit(Post $post): Response
    {
        $this->denyAccessUnlessGranted('POST_EDIT', $post);

        return $this->render('post/edit.html.twig', ['post' => $post]);
    }
}
```

**Rule 2: Check permissions for specific users safely**

Use `isGrantedForUser()` or `getAccessDecisionForUser()` when evaluating access control permissions for a specific user object without replacing or modifying the active authentication token in global storage.

```php
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\User\UserInterface;

public function checkOfflineUserAccess(Security $security, UserInterface $offlineUser): bool
{
    return $security->isGrantedForUser($offlineUser, 'ROLE_BAR');
}
```

**Rule 3: Restrict user impersonation privileges**

Protect user impersonation via `SwitchUserListener` with strict role permissions defaulting to `ROLE_ALLOWED_TO_SWITCH` and ensure authorization checks evaluate against the original token.

```php
use Symfony\Component\Security\Http\Firewall\SwitchUserListener;

$listener = new SwitchUserListener(
    $tokenStorage,
    $userProvider,
    $userChecker,
    'main',
    $accessDecisionManager,
    role: 'ROLE_ALLOWED_TO_SWITCH'
);
```

**Rule 4: Align subject parameter names in IsGranted attributes**

Ensure that subject argument names declared in `#[IsGranted]` attributes match parameters defined in the controller method signature to prevent unhandled runtime exceptions.

```php
use Symfony\Component\Security\Http\Attribute\IsGranted;

class ArticleController
{
    #[IsGranted('EDIT', subject: 'article')]
    public function edit(Article $article): Response
    {
        return new Response();
    }
}
```


## Category: api contract misuse

### Verify token attributes and avoid offline token session checks

**Use when**

When retrieving attributes from security tokens or evaluating authentication attributes in background workers and non-interactive contexts.

**Secure rules**

**Rule 1: Check token attribute existence before retrieval**

Use `hasAttribute()` to check if an attribute exists before calling `getAttribute()` on `AbstractToken` instances to prevent throwing an `InvalidArgumentException`.

```php
if ($token->hasAttribute('tenant_id')) {
    $tenantId = $token->getAttribute('tenant_id');
} else {
    // Handle missing attribute safely
}
```

**Rule 2: Avoid session authentication attributes on offline tokens**

Do not evaluate session-dependent authentication attributes against tokens implementing `OfflineTokenInterface`, as the `AuthenticatedVoter` will throw an `InvalidArgumentException`.

```php
if ($authorizationChecker->isGranted('PUBLIC_ACCESS')) {
    // Process public background task
}
```


## Category: authentication

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


## Category: boundary control

### Enforce Request Middleware Boundaries and Early Request Short-Circuiting

**Use when**

Implementing HTTP kernel request event listeners, security filters, or failure handling middleware where untrusted inputs or sub-requests cross into trusted execution pipelines.

**Secure rules**

**Rule 1: Restrict forward paths in authentication failure handling middleware using static configuration.**

When enabling internal request forwarding via `failure_forward => true` in authentication failure middleware, ensure failure target paths are strictly controlled via static handler configuration rather than user-controlled request attributes. Request-supplied `_failure_path` inputs must be ignored.

```php
$options = [
    'failure_forward' => true,
    'failure_path' => '/login',
];
$handler = new DefaultAuthenticationFailureHandler($httpKernel, $httpUtils, $options, $logger);
```

**Rule 2: Prevent session state creation during stateless middleware authentication failures.**

When processing authentication failures in stateless HTTP middleware pipelines, verify that request attributes mark the request as stateless (`_stateless => true`) so authentication exceptions are not persisted to the session, avoiding session leakage across unauthenticated client requests.

```php
$request->attributes->set('_stateless', true);
$response = $handler->onAuthenticationFailure($request, $exception);
```


## Category: cryptography

### Use UserPasswordHasherInterface for Secure Password Hashing

**Use when**

When hashing and verifying user credentials in Symfony applications to ensure proper cryptographic work factors and algorithms.

**Secure rules**

**Rule 1: Always use Symfony's configured UserPasswordHasherInterface to hash user passwords instead of custom implementations or direct PHP hashing functions.**

Inject `UserPasswordHasherInterface` into your services or controllers to securely hash plain passwords using the framework's configured hashing strategies.

```php
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;

public function registerUser(UserPasswordHasherInterface $passwordHasher, PasswordAuthenticatedUserInterface $user, string $plainPassword): void
{
    $hashedPassword = $passwordHasher->hashPassword($user, $plainPassword);
    $user->setPassword($hashedPassword);
}
```


## Category: csrf

### Configure Framework CSRF Protection and Token Validation

**Use when**

When configuring framework CSRF protection, form login authentication, or validating custom state-changing requests.

**Secure rules**

**Rule 1: Enable framework CSRF protection and validate tokens using `isCsrfTokenValid()` or `CsrfTokenManagerInterface::isTokenValid()`.**

Ensure `framework.csrf_protection` is enabled in configuration and validate submitted tokens with constant-time comparison methods to prevent forgery attacks.

```yaml
framework:
    csrf_protection:
        enabled: true
        stateless_token_ids: ['submit_form_action']
        check_header: true
        cookie_name: 'csrf-token'
```


## Category: file handling

### Sanitize and Isolate File Paths When Serving Uploads

**Use when**

Serving user-uploaded files and handling downloads via controller responses.

**Secure rules**

**Rule 1: Sanitize file paths to prevent path traversal and enforce attachment disposition.**

When serving files through `AbstractController`'s `file()` helper, sanitize input filenames using `basename()` to prevent path traversal and rely on attachment disposition to prevent browsers from executing untrusted files.

```php
public function download(string $filename): Response
{
    $path = $this->getParameter('kernel.project_dir') . '/var/uploads/' . basename($filename);
    return $this->file($path);
}
```


## Category: injection

### Use Query Placeholders for LDAP Search Queries

**Use when**

When configuring custom LDAP user search queries with `LdapBadge` in Symfony security components to prevent LDAP injection.

**Secure rules**

**Rule 1: Use Symfony's LDAP query placeholders instead of concatenating raw user input into search strings.**

Pass search query templates containing placeholders like `{user_identifier}` to `LdapBadge`. This ensures user identifiers are safely escaped using `LdapInterface::ESCAPE_FILTER` automatically before directory lookups are executed.

```php
use Symfony\Component\Ldap\Security\LdapBadge;

$badge = new LdapBadge(
    'app.ldap',
    'dn=host,dc=example,dc=com',
    'admin_user',
    'admin_password',
    '(sAMAccountName={user_identifier})'
);
```


## Category: input interpretation safety

### Enforce strict string type checks on login and authentication parameters

**Use when**

Handling authentication credentials and CSRF tokens from incoming HTTP requests to prevent type confusion or parameter tampering bypasses.

**Secure rules**

**Rule 1: Validate credential and token parameter data types strictly to reject arrays, integers, or arbitrary objects.**

Rely on `FormLoginAuthenticator` to reject invalid types like arrays or objects on inputs such as `_username` and `_password` with a `BadRequestHttpException`, and ensure empty strings or excessively long values trigger a `BadCredentialsException`.

```php
$authenticator = new FormLoginAuthenticator(
    $httpUtils,
    $userProvider,
    $successHandler,
    $failureHandler,
    [
        'username_parameter' => '_username',
        'password_parameter' => '_password',
    ]
);
```


## Category: interface protocol hardening

### Restrict Allowed HTTP Method Overrides on POST Requests

**Use when**

Configuring request handling and HTTP method overriding mechanisms in Symfony applications.

**Secure rules**

**Rule 1: Keep `http_method_override` disabled unless explicitly required, and restrict allowed overridden methods if enabled.**

When method override support is required, enable `http_method_override` explicitly and restrict the list of allowed methods to safe options such as `PUT`, `PATCH`, and `DELETE` via framework configuration.

```yaml
framework:
    http_method_override: true
    allowed_http_method_override: ['PUT', 'PATCH', 'DELETE']
```


## Category: network boundary

### Configure Trusted Proxies and Hosts for Network Boundaries

**Use when**

Configuring the Symfony framework when running applications behind reverse proxies or load balancers to secure network boundaries.

**Secure rules**

**Rule 1: Explicitly define trusted hosts, proxies, and headers in framework configuration.**

Specify valid patterns in `trusted_hosts`, specific IP ranges in `trusted_proxies`, and valid header names in `trusted_headers` to prevent HTTP Host header attacks and client IP spoofing.

```yaml
framework:
    trusted_hosts: ['^example\.com$', '^api\.example\.com$']
    trusted_proxies: '10.0.0.0/8'
    trusted_headers: ['x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-port']
```


## Category: output encoding

### Escape last username values during HTML rendering

**Use when**

Rendering the last authenticated username value derived from request or session input inside HTML templates to prevent Cross-Site Scripting.

**Secure rules**

**Rule 1: Apply context-appropriate output encoding to the last username value before inserting it into HTML output.**

Treat the value returned by `AuthenticationUtils::getLastUsername()` as untrusted input. Rely on Twig auto-escaping in HTML context or manually escape output using `htmlspecialchars()` with `ENT_QUOTES | ENT_SUBSTITUTE` and `UTF-8` encoding when rendering raw PHP templates.

```php
// Twig auto-escapes variables in HTML context by default:
// <input type="text" name="_username" value="{{ last_username }}">

// If rendering raw PHP templates, manually escape output:
$safeUsername = htmlspecialchars($authenticationUtils->getLastUsername(), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
```


## Category: runtime environment hardening

### Disable Web Profiler and Security Data Collectors in Production Environments

**Use when**

Configuring Symfony application bundles and environment files for production deployment.

**Secure rules**

**Rule 1: Disable debug profiling and data collectors in production environments**

Ensure that the `WebProfilerBundle` and associated debugging features are restricted to non-production environments such as development. Explicitly set profiler functionality to `false` under production configuration blocks to prevent exposing sensitive security state, authorization decisions, user roles, and internal firewall configurations.

```yaml
when@dev:
    web_profiler:
        toolbar: true
        intercept_redirects: false

when@prod:
    framework:
        profiler: { enabled: false }
```


## Category: secret handling

### Load and protect application secrets and decryption keys securely

**Use when**

When configuring application secrets, managing decryption keys, and handling credentials in Symfony applications.

**Secure rules**

**Rule 1: Populate framework.secret using a strong environment variable and never leave it empty or hardcoded.**

Ensure `framework.secret` is configured with a high-entropy secret derived from an environment variable to prevent signature forgery and CSRF vulnerabilities across Symfony components.

```yaml
framework:
    secret: '%env(APP_SECRET)%'
```

**Rule 2: Exclude private decryption key files from version control and public web directories.**

When using SodiumVault or vault-based secret storage, ensure generated private decryption keys like `decrypt.private.php` are kept out of public repositories and provided dynamically through environment variables.

```php
use Symfony\Bundle\FrameworkBundle\Secrets\SodiumVault;

$vault = new SodiumVault(
    secretsDir: $kernel->getProjectDir().'/config/secrets/prod',
    decryptionKey: $_ENV['SYMFONY_DECRYPTION_SECRET'] ?? null
);
```


## Category: security control integrity

### Enforce Mandatory Security Badges and Consistent Authentication Validation

**Use when**

Developing or configuring authentication components and firewall managers where mandatory security badges and credential verification rules must be strictly enforced without bypass.

**Secure rules**

**Rule 1: Pass required passport badges to AuthenticatorManager to ensure authentication fails if an authenticator yields a passport missing mandatory security badges.**

When instantiating the AuthenticatorManager or configuring authentication workflows, specify mandatory badges such as `CsrfTokenBadge::class` so that missing security controls cause authentication requests to be rejected.

```php
use Symfony\Component\Security\Http\Authentication\AuthenticatorManager;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\CsrfTokenBadge;

$manager = new AuthenticatorManager(
    $authenticators,
    $tokenStorage,
    $eventDispatcher,
    'main',
    requiredBadges: [CsrfTokenBadge::class]
);
```

**Rule 2: Mark all attached passport badges as resolved during check passport events.**

Ensure custom Passport instances mark all attached badges as resolved during `CheckPassportEvent` listeners, as `AuthenticatorManager` throws a `BadCredentialsException` if any badge remains unresolved.

```php
use Symfony\Component\Security\Http\Event\CheckPassportEvent;

public function onCheckPassport(CheckPassportEvent $event): void
{
    $passport = $event->getPassport();
    if ($passport->hasBadge(CustomBadge::class)) {
        $badge = $passport->getBadge(CustomBadge::class);
        $badge->markResolved();
    }
}
```

**Rule 3: Implement EquatableInterface on custom User entities to ensure session integrity checks deauthenticate users upon security property changes.**

Implement `EquatableInterface` on custom User entities and define `isEqualTo()` to compare critical security state properties so that stale or modified sessions are invalidated across requests.

```php
use Symfony\Component\Security\Core\User\EquatableInterface;
use Symfony\Component\Security\Core\User\UserInterface;

class User implements UserInterface, EquatableInterface
{
    private string $id;
    private bool $enabled;
    private array $roles = [];

    public function isEqualTo(UserInterface $user): bool
    {
        if (!$user instanceof self) {
            return false;
        }

        return $this->id === $user->id
            && $this->enabled === $user->enabled
            && $this->roles === $user->getRoles();
    }
}
```


## Category: session management

### Configure Session Fixation Protection and Cookie Security Parameters

**Use when**

When configuring application security firewalls and framework session settings for user authentication and cookie attributes.

**Secure rules**

**Rule 1: Enable session fixation protection and secure cookie attributes in security and framework configurations.**

Keep the `session_fixation_strategy` set to `migrate` or `invalidate` to prevent session fixation attacks. Configure remember-me and session cookie parameters to enforce HTTPS, protect against client-side script theft by setting `httponly` to `true`, and ensure `secure` is set to `true` or `auto` alongside an appropriate `samesite` directive.

```yaml
security:
    session_fixation_strategy: migrate
    firewalls:
        main:
            remember_me:
                secret: '%kernel.secret%'
                secure: true
                httponly: true
                samesite: 'lax'

framework:
    session:
        name: 'CUSTOM_SESS_ID'
        cookie_secure: 'auto'
        cookie_samesite: 'lax'
```


### Handle Persistent Remember-Me Token Theft and Session Invalidation

**Use when**

When managing persistent session remember-me tokens, persistent session revocation, and detecting potential cookie theft.

**Secure rules**

**Rule 1: Handle CookieTheftException to invalidate compromised token series and enforce persistent remember-me token handling.**

When using PersistentRememberMeHandler for persistent session handling, catch `CookieTheftException` when an unexpected token value is presented for a valid series ID. Invalidate the compromised token series and reset the authentication context to prevent session hijacking.

```php
use Symfony\Component\Security\Http\RememberMe\PersistentRememberMeHandler;
use Symfony\Component\Security\Core\Exception\CookieTheftException;

try {
    $handler->consumeRememberMeCookie($rememberMeDetails);
} catch (CookieTheftException $e) {
    $tokenProvider->deleteTokenBySeries($rememberMeDetails->getSeries());
}
```
