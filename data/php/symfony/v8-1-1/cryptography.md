# Security cards

Repository: `https://github.com/symfony/symfony#v8.1.1`
Category: cryptography

## cryptography

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
