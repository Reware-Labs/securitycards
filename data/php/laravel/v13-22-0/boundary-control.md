# Security cards

Repository: `https://github.com/laravel/framework#v13.22.0`
Documentation repository: `https://github.com/laravel/docs#13.x`
Category: boundary control

## boundary control

### Validate custom unauthenticated redirect callbacks

**Use when**

When registering a custom redirect handler using Authenticate::redirectUsing() to determine where unauthenticated users should be redirected.

**Secure rules**

**Rule 1: Configure unauthenticated-user redirects with `redirectGuestsTo`**

Laravel's `auth` middleware redirects unauthenticated users to the `login` named route by default. To customize this destination, configure `redirectGuestsTo` within `bootstrap/app.php` using a path string or a closure that returns the intended route.

```php
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

->withMiddleware(function (Middleware $middleware): void {
    $middleware->redirectGuestsTo(fn (Request $request) => route('login'));
})
```
