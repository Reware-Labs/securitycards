# Security cards

Repository: `https://github.com/laravel/framework#v13.22.0`
Documentation repository: `https://github.com/laravel/docs#13.x`
Category: secret handling

## secret handling

### Annotate Credentials and Secrets with SensitiveParameter Attribute

**Use when**

When implementing custom authentication guards, credential providers, password reset methods, or request wrappers that handle raw passwords, tokens, or encryption keys.

**Secure rules**

**Rule 1: Apply PHP's SensitiveParameter attribute to sensitive parameters to redact secrets from exception stack traces and log dumps.**

Decorate parameters containing plain-text credentials, tokens, or hash keys with the `#[\SensitiveParameter]` attribute across all custom methods, user providers, and request handlers to ensure PHP automatically redacts secret values from error logs and stack traces.

```php
public function loginUser(#[
    \SensitiveParameter
] array $credentials): bool
{
    return Auth::guard('web')->attempt($credentials);
}
```


### Prevent Sensitive Data and Credentials from Flashing or Logging

**Use when**

When configuring exception handlers, handling form validation failures, logging application errors, or managing redirect input flashing.

**Secure rules**

**Rule 1: Register sensitive request inputs with dontFlash or exclude them from redirects to prevent raw secrets from persisting in session storage or logs.**

Ensure custom credentials, API keys, and sensitive form inputs are explicitly excluded using `dontFlash` on the exception handler, filtered out of custom exception context callbacks, and excluded from redirect input flashing via `exceptInput` to avoid credential exposure in sessions or log files.

```php
$exceptions->dontFlash([
    'credit_card_number',
    'cvv',
    'api_token',
    'two_factor_code',
]);
```


### Securely Store and Rotate Cryptographic Keys, Tokens, and Environment Files

**Use when**

When configuring application encryption keys, token guards, password reset repositories, and environment file encryption workflows.

**Secure rules**

**Rule 1: Enable token hashing, configure application and encryption keys securely, and prune plaintext environment files after encryption.**

Configure TokenGuard with hashing enabled, maintain strong application keys and previous keys for key rotation, avoid passing decryption keys via CLI arguments, and prune unencrypted environment files using the `--prune` flag during encryption operations.

```php
'guards' => [
    'api' => [
        'driver' => 'token',
        'provider' => 'users',
        'hash' => true,
    ],
];
```
