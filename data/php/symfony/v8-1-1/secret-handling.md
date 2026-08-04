# Security cards

Repository: `https://github.com/symfony/symfony#v8.1.1`
Category: secret handling

## secret handling

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
