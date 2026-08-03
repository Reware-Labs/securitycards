# Security cards

Repository: `https://github.com/laravel/framework#v13.22.0`
Documentation repository: `https://github.com/laravel/docs#13.x`
Category: resource exhaustion

## resource exhaustion

### Configure multi-tiered rate limits and throttling to protect endpoints against resource exhaustion

**Use when**

Use when configuring request rate limits or token repository throttles to defend application endpoints and authentication routes against burst traffic spikes, denial of service, and brute force attacks.

**Secure rules**

**Rule 1: Configure multi-tiered request rate limits using ThrottleRequests and RateLimiter**

Combine per-second and per-minute rate limits in a single named limiter using `RateLimiter::for` and attach it to sensitive routes via the `ThrottleRequests` middleware to ensure HTTP `429` status responses with proper `Retry-After` headers are returned when request limits are exceeded.

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Routing\Middleware\ThrottleRequests;

RateLimiter::for('login-protection', function ($request) {
    return [
        Limit::perSecond(2)->by($request->ip()),
        Limit::perMinute(10)->by($request->ip()),
    ];
});

Route::post('/login', [AuthController::class, 'login'])
    ->middleware(ThrottleRequests::using('login-protection'));
```

**Rule 2: Enforce strict throttling and lifespan limits on token repositories**

Always keep the `throttle` parameter enabled with a value greater than `0` and set `expire` to a minimum reasonable threshold in configuration files to prevent attackers from spamming token generation or abusing finite system resources.

```php
'passwords' => [
    'users' => [
        'provider' => 'users',
        'table' => 'password_reset_tokens',
        'expire' => 60,
        'throttle' => 60,
    ],
];
```
