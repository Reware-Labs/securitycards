# Security cards

Repository: `https://github.com/laravel/framework#v13.22.0`
Documentation repository: `https://github.com/laravel/docs#13.x`
Category: cryptography

## cryptography

### Encrypt Sensitive Application Data and Maintain Secure Key Requirements

**Use when**

Encrypting sensitive model attributes, session storage, environment configurations, and ensuring correct cipher and key length initialization.

**Secure rules**

**Rule 1: Use authenticated encryption ciphers with correctly sized keys and built-in casts for sensitive model attributes and sessions.**

Ensure keys match the required byte length for the chosen cipher and prefer AEAD ciphers such as `aes-256-gcm`. Enable session encryption and utilize Eloquent encrypted attribute casts to protect sensitive data at rest.

```php
$key = \Illuminate\Encryption\Encrypter::generateKey('aes-256-gcm');

$encrypter = new \Illuminate\Encryption\Encrypter($key, 'aes-256-gcm');
```


### Perform Constant-Time Comparisons and Secure Token Verification

**Use when**

Verifying password reset tokens, user remember tokens, and signed route signatures securely.

**Secure rules**

**Rule 1: Use constant-time comparison functions when validating tokens and cryptographic signatures.**

Always perform comparisons of sensitive authentication tokens, remember tokens, and signed route signatures using `hash_equals()` rather than standard comparison operators to prevent timing side-channel attacks.

```php
if ($user && $user->getRememberToken() && hash_equals($user->getRememberToken(), $token)) {
    // Token matches securely
}
```
