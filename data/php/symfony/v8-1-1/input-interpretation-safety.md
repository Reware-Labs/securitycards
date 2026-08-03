# Security cards

Repository: `https://github.com/symfony/symfony#v8.1.1`
Category: input interpretation safety

## input interpretation safety

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
