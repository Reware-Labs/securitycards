# Security cards

Repository: `https://github.com/laravel/framework#v13.22.0`
Documentation repository: `https://github.com/laravel/docs#13.x`
Category: security control integrity

## security control integrity

### Maintain correct HTTP middleware priority order and restrict scope

**Use when**

Configuring HTTP middleware stack priorities and managing middleware exclusions in route groups or tests.

**Secure rules**

**Rule 1: Ensure essential security middleware execute in the proper sequence by explicitly positioning them relative to established security middleware using priority methods.**

When modifying HTTP middleware priorities, ensure that cookie encryption, session initialization, and request authentication execute before route authorization and parameter binding substitution.

```php
$kernel->addToMiddlewarePriorityAfter([
    \Illuminate\Cookie\Middleware\EncryptCookies::class,
    \Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests::class,
], \App\Http\Middleware\CustomSecurityCheck::class);
```

**Rule 2: Avoid globally disabling security middleware during feature testing or route grouping.**

When writing feature tests or managing route groups, avoid calling `withoutMiddleware()` without parameters, as it globally disables all application middleware. Instead, selectively disable only non-security middleware.

```php
$this->withoutMiddleware([\App\Http\Middleware\AuditLog::class]);
$response = $this->actingAs($adminUser)->post('/admin/settings', $data);
$response->assertStatus(200);
```

**Rule 3: Explicitly scope middleware exclusions using exact class names.**

When bypassing middleware on specific routes, explicitly pass the exact non-security middleware class string to `withoutMiddleware()` to preserve active security controls.

```php
Route::middleware(['auth', 'throttle:60,1'])->group(function () {
    Route::get('/public-stats', [StatsController::class, 'index'])
        ->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class);
});
```
