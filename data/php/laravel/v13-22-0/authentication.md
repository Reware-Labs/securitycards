# Security cards

Repository: `https://github.com/laravel/framework#v13.22.0`
Documentation repository: `https://github.com/laravel/docs#13.x`
Category: authentication

## authentication

### Enforce Credential Binding and Guard Configuration for Authentication

**Use when**

Configuring authentication guards, token storage, and multi-guard request routing.

**Secure rules**

**Rule 1: Enable token hashing in guard configuration to protect stored API credentials.**

When configuring token-based authentication guards via `AuthManager`, explicitly set the `hash` option to `true` in the guard configuration array to avoid storing plaintext API tokens in the database.

```php
'guards' => [
    'api' => [
        'driver' => 'token',
        'provider' => 'users',
        'hash' => true,
        'input_key' => 'api_token',
        'storage_key' => 'api_token',
    ],
],
```


### Validate Token Signatures, Expiration, and Throttling for Password Resets

**Use when**

Implementing password reset workflows and managing token lifecycles and request limits.

**Secure rules**

**Rule 1: Check return statuses and enforce token expiration and single-use constraints.**

Explicitly check return statuses such as `Password::PASSWORD_RESET`, `Password::INVALID_TOKEN`, and `Password::RESET_THROTTLED` when invoking password reset operations. Ensure tokens are validated for expiration and deleted immediately after successful use.

```php
$status = Password::reset(
    $request->only('email', 'password', 'password_confirmation', 'token'),
    function ($user, string $password) {
        $user->forceFill([
            'password' => Hash::make($password),
        ])->save();
    }
);

if ($status === Password::PASSWORD_RESET) {
    return redirect()->route('login');
}
```

**Rule 2: Enforce request throttling and expiration parameters for reset tokens.**

Configure token expiration and request throttling limits via `CacheTokenRepository` or `PasswordBrokerManager` settings to prevent email spamming, token enumeration, and brute-force attacks.

```php
use Illuminate\Auth\Passwords\CacheTokenRepository;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Contracts\Hashing\Hasher;

$repository = new CacheTokenRepository(
    cache: $app[CacheRepository::class],
    hasher: $app[Hasher::class],
    hashKey: config('app.key'),
    expires: 3600,
    throttle: 60
);
```


### Verify and Validate Passwords and Credentials

**Use when**

Verifying user credentials during authentication attempts and password update workflows.

**Secure rules**

**Rule 1: Use framework password hashing and verification methods to prevent invalid credentials acceptance.**

Always use `Hash::check()` or built-in authentication guard validation routines to verify presented credentials securely. When implementing password resets or updates via `PasswordBroker::reset()`, ensure the callback securely hashes and persists the new password using `Hash::make()` before saving the user entity.

```php
$status = Password::reset($credentials, function ($user, $password) {
    $user->forceFill([
        'password' => Hash::make($password),
    ])->save();
});
```

**Rule 2: Maintain timing bounds during credential verification to prevent user enumeration.**

Ensure custom authentication guards and credential verification routines maintain equal execution time bounds using a `Timebox` instance to prevent attackers from using timing side-channel analysis to enumerate valid usernames.

```php
use Illuminate\Auth\SessionGuard;
use Illuminate\Support\Timebox;

$guard = new SessionGuard(
    'web',
    $userProvider,
    $session,
    $request,
    new Timebox,
    rehashOnLogin: true,
    timeboxDuration: 200000
);
```
