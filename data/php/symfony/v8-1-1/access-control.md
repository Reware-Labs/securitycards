# Security cards

Repository: `https://github.com/symfony/symfony#v8.1.1`
Category: access control

## access control

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
