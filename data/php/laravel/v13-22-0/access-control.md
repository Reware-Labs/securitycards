# Security cards

Repository: `https://github.com/laravel/framework#v13.22.0`
Documentation repository: `https://github.com/laravel/docs#13.x`
Category: access control

## access control

### Configure Explicit CORS Policies and Restrict Origins for API Routes

**Use when**

Configuring cross-origin resource sharing headers, allowed methods, allowed origins, and middleware routing constraints in Laravel applications.

**Secure rules**

**Rule 1: Restrict CORS allowed origins to explicit trusted domains instead of wildcards.**

In `config/cors.php`, define exact trusted domain names under `allowed_origins` rather than wildcards or subdomain patterns like `*.domain.com` which can match nested subdomains unintentionally.

```php
return [
    'allowed_origins' => [
        'https://app.example.com',
        'https://dashboard.example.com',
    ],
];
```

**Rule 2: Scope CORS middleware strictly to API routes and limit allowed methods and headers.**

Explicitly specify `paths`, `allowed_methods`, and `allowed_headers` in `config/cors.php` to prevent exposing unvetted request headers and methods to non-API routes.

```php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['GET', 'POST'],
    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Custom-Header'],
    'supports_credentials' => false,
];
```

**Rule 3: Configure CORS through Laravel's published configuration**

Laravel automatically includes `HandleCors` in the global middleware stack and handles CORS `OPTIONS` requests using configured values. When custom CORS behavior is required, publish `config/cors.php` and configure the applicable paths, methods, origins, headers, and credential support there.

```shell
php artisan config:publish cors
```


### Enforce Route and Controller-Level Authorization Checks

**Use when**

When building routes and controllers that require strict access control and policy validation.

**Secure rules**

**Rule 1: Enforce route-level authorization using the authorize middleware and ensure proper middleware ordering.**

Attach authorization middleware to your routes and ensure that route model binding substitution runs before authorization checks so that the Gate receives resolved model instances.

```php
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Support\Facades\Route;

Route::get('/posts/{post}/edit', [PostController::class, 'edit'])
    ->middleware([
        SubstituteBindings::class,
        Authorize::class.':edit,post',
    ]);
```

**Rule 2: Enforce access control inside controllers using the AuthorizesRequests trait.**

Call the `authorize()` method at the beginning of sensitive controller operations to evaluate policies and automatically throw an authorization exception if the user lacks permissions.

```php
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class PostController
{
    use AuthorizesRequests;

    public function update(Request $request, Post $post)
    {
        $this->authorize('update', $post);

        $post->update($request->validated());
    }
}
```


### Implement Explicit Form Request Authorization

**Use when**

When creating custom Form Request classes to handle incoming request data and validation.

**Secure rules**

**Rule 1: Implement the authorize method in Form Requests to prevent bypass of access control.**

Explicitly define the `authorize()` method on every custom Form Request to verify user permissions, as the default behavior allows requests if the method is omitted.

```php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Post::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
        ];
    }
}
```
