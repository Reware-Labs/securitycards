# Security cards

Repository: `https://github.com/symfony/symfony#v8.1.1`
Category: security control integrity

## security control integrity

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
