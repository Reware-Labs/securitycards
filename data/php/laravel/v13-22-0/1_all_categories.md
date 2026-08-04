# Security cards

Repository: `https://github.com/laravel/framework#v13.22.0`
Documentation repository: `https://github.com/laravel/docs#13.x`

## Category: access control

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


## Category: authentication

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


## Category: boundary control

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


## Category: configuration source integrity

### Store environment files outside the public web root

**Use when**

Configuring application environment paths and loading configuration files in Laravel.

**Secure rules**

**Rule 1: Store environment files in a non-public directory located outside the web server root to ensure configuration source integrity.**

When configuring application environment paths using `useEnvironmentPath` or `loadEnvironmentFrom`, make sure that environment files like `.env` are stored outside the public directory and restrict file permissions on server environments to prevent unauthorized access to configuration settings.

```php
$app->useEnvironmentPath($app->basePath());
$app->loadEnvironmentFrom('.env');
```


## Category: cryptography

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


## Category: csrf

### Configure CSRF Protection and Token Validation in Laravel

**Use when**

When building state-changing HTML forms, routing endpoints, or configuring CSRF middleware and session cookie policies to prevent cross-site request forgery attacks.

**Secure rules**

**Rule 1: Include CSRF verification fields in state-changing HTML form submissions.**

Use `csrf_field()` or `csrf_token()` when rendering HTML form templates or initiating custom HTTP requests to ensure Laravel's CSRF verification middleware can validate the request authenticity.

```html
<form method="POST" action="/user/profile">
    {!! csrf_field() !!}
    <input type="text" name="email">
    <button type="submit">Update</button>
</form>
```

**Rule 2: Restrict CSRF protection exceptions to external stateless endpoints.**

When configuring URI exclusions on `PreventRequestForgery` via `except()` or the `$except` array, ensure state-changing endpoints are not exposed unnecessarily. Only exclude endpoints that must receive external cross-site requests like webhooks, and ensure those endpoints implement alternative security checks like HMAC signature verification.

```php
PreventRequestForgery::except([
    'stripe/webhook',
    'github/webhook',
]);
```

**Rule 3: Configure SameSite attribute on session cookies to defend against cross-site request forgery.**

Set the `same_site` option to 'lax' or 'strict' to enforce browser restrictions on cross-site session cookie transmission, providing a strong baseline defense against cross-site request forgery attacks.

```ini
SESSION_SAME_SITE=lax
```


## Category: deserialization

### Disable Unserialization During Decryption for Non-Object Payloads

**Use when**

When decrypting raw strings, cookies, or non-object values using `decrypt()` or `Encrypter` to prevent automatic PHP object instantiation.

**Secure rules**

**Rule 1: Explicitly disable unserialization when handling non-object payloads in decryption methods.**

When decrypting raw strings, tokens, or non-object values, developers should explicitly pass `unserialize: false` or utilize `decryptString()` to prevent PHP `unserialize()` from automatically processing decrypted payloads into instantiated objects. This avoids object injection gadget chains when handling arbitrary data.

```php
$encrypter = new \Illuminate\Encryption\Encrypter($key, 'aes-256-gcm');

// Safe string encryption and decryption without unserialization
$ciphertext = $encrypter->encryptString('sensitive-user-token');
$decryptedToken = $encrypter->decryptString($ciphertext);
```


## Category: file handling

### Secure Static File Storage, Access Control, and Delivery

**Use when**

Configuring, storing, publishing, or serving static files and assets to ensure they remain protected against unauthorized disclosure, traversal, or modification.

**Secure rules**

**Rule 1: Restrict direct public access to sensitive static files by storing them with private visibility or serving them using temporary signed URLs.**

Explicitly define and manage visibility attributes for static files using `setVisibility()` or passing visibility options when writing files to prevent unauthorized direct web access. For sensitive assets, generate time-limited URLs using `Storage::temporaryUrl()` rather than exposing permanent public links.

```php
use Illuminate\Support\Facades\Storage;

Storage::disk('s3')->put('user-docs/id.pdf', $fileContents, 'private');

$temporaryUrl = Storage::disk('s3')->temporaryUrl(
    'confidential/statement.pdf',
    now()->addMinutes(15)
);
```

**Rule 2: Store user-provided static files using randomized hashes and restrict storage directories to designated paths.**

Store user-provided static files using `Storage::putFile()` rather than user-supplied filenames directly to avoid path traversal, overwrites, and predictable file path guessing. Additionally, ensure custom public path configurations point strictly to isolated public directories and never to root or application configuration folders.

```php
$path = Storage::disk('uploads')->putFile('avatars', $request->file('avatar'));
```

**Rule 3: Enforce read-only mode and secure streamed responses for static file disks and controller downloads.**

Configure `'read-only' => true` on filesystem disk instances dedicated to serving immutable static files and public assets to prevent unauthorized mutations or file deletion. When serving files through controller endpoints, use `Storage::response()` or `Storage::download()` to automatically sanitize headers, handle MIME types, and apply safe ASCII fallback filtering.

```php
$staticDisk = $filesystemManager->build([
    'driver' => 'local',
    'read-only' => true,
    'root' => storage_path('app/public/static'),
    'url' => config('app.url').'/storage/static',
    'visibility' => 'public',
]);

return Storage::disk('local')->download('exports/report.pdf', 'user_report.pdf');
```


### Validate Uploaded Files with Strict Constraints

**Use when**

Handling file uploads from user requests to ensure proper file size and type validation.

**Secure rules**

**Rule 1: Apply explicit validation rules to uploaded files to check size and allowed types.**

Use validation rules such as `file`, `mimes`, `mimetypes`, `max`, or `dimensions` on uploaded files to automatically verify `UploadedFile::isValid()` and handle PHP upload size limits correctly.

```php
$validator = Validator::make($request->all(), [
    'avatar' => 'required|file|mimes:jpeg,png|max:2048',
]);

if ($validator->fails()) {
    return response()->json($validator->errors(), 422);
}
```


## Category: injection

### Prevent SQL injection by using query builder parameter binding instead of raw expressions

**Use when**

When constructing database queries using user-controlled input in Laravel.

**Secure rules**

**Rule 1: Use standard Query Builder methods for parameter binding instead of passing user input into raw SQL expressions.**

Standard Query Builder methods automatically bind values as PDO parameters. Avoid passing user-controlled input directly into raw SQL expressions such as Illuminate\Database\Query\Expression or DB::raw() because raw expressions bypass parameter binding entirely.

```php
// Unsafe: Passing user input into a raw expression
$builder->whereDate('created_at', new Raw($request->input('date')));

// Safe: Using query builder parameter binding
$builder->whereDate('created_at', '=', $request->input('date'));
```


## Category: input contract definition

### Enforce Strict Input Validation Contracts and Filter Unvalidated Request Attributes

**Use when**

Handling incoming HTTP requests and processing user input data against defined validation rules and contracts.

**Secure rules**

**Rule 1: Obtain request data exclusively via validated methods to reject unvalidated attributes and prevent mass assignment vulnerabilities.**

Always use `$validator->validated()` or `$request->validate()` to retrieve request data rather than accessing unvalidated input via `$request->all()`. The validated method guarantees that only fields defined in the validation rules array are returned, dropping undeclared attributes and preventing unexpected database modifications.

```php
use Illuminate\Support\Facades\Validator;

$validator = Validator::make($request->all(), [
    'name' => 'required|string',
    'email' => 'required|email',
]);

if ($validator->fails()) {
    throw new \Illuminate\Validation\ValidationException($validator);
}

$safeData = $validator->validated();
User::create($safeData);
```

**Rule 2: Define complete validation contracts for precognitive and standard request submissions.**

Ensure complete server-side validation contracts are defined within `FormRequest` classes or request validation calls. Normal non-precognitive submissions must process the full validation rule set to prevent invalid or malicious payloads from bypassing validation during execution.

```php
use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', User::class);
    }

    public function rules(): array
    {
        return [
            'username' => 'required|string|max:50',
            'email' => 'required|email|unique:users,email',
        ];
    }
}
```

**Rule 3: Configure strict RFC validation to reject ambiguous email formats.**

Use `rfcCompliant(strict: true)` or `strict()` to enforce rigid RFC email validation and reject ambiguous input structures like comments, quoted spaces, or non-TLD domain literals, preventing parser differentials.

```php
$request->validate([
    'email' => ['required', Rule::email()->rfcCompliant(strict: true)],
]);
```

**Rule 4: Use array format for validation rules containing regex pipe characters.**

When defining validation rules that contain regular expressions with pipe characters, supply the rules as an array rather than a pipe-delimited string to prevent the `ValidationRuleParser` from splitting the regular expression and corrupting validation logic.

```php
$rules = [
    'type' => ['required', 'regex:/^(foo|bar)$/i'],
];
```


## Category: input interpretation safety

### Canonicalize and Validate Encoded Route Parameters Before Processing

**Use when**

When validating route parameters or path identifiers that undergo automatic URL decoding and require canonical interpretation.

**Secure rules**

**Rule 1: Apply explicit regex constraints using the where() method to validate route parameters before using them in filesystem operations or downstream logic.**

Laravel automatically URL-decodes percent-encoded route parameters during route matching. You must constrain and validate these parameters using the `where()` method to prevent unexpected interpretation or path traversal vulnerabilities.

```php
Route::get('/files/{file}', function (string $file) {
    return Storage::download($file);
})->where('file', '[a-zA-Z0-9_\-\.]+');
```


## Category: interface protocol hardening

### Configure Strict CORS Security Headers

**Use when**

Configuring Cross-Origin Resource Sharing in `config/cors.php` and ensuring the `HandleCors` middleware properly manages origin boundaries and HTTP response headers.

**Secure rules**

**Rule 1: Explicitly define trusted origins and allowed headers in `config/cors.php` instead of using global wildcards.**

Specify explicit allowed origins and headers in `config/cors.php` to prevent untrusted third-party origins or compromised subdomains from reading sensitive API responses. Ensure the `HandleCors` middleware runs to return proper `Access-Control-Allow-Origin` and `Access-Control-Allow-Headers` headers across all responses, including redirects and errors.

```php
return [
    'paths' => ['api/*'],
    'allowed_origins' => ['https://app.example.com'],
    'allowed_headers' => ['X-Requested-With', 'Content-Type', 'Authorization'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE'],
    'supports_credentials' => true,
];
```


### Validate incoming HTTP Host headers and manage cross-site request forgery protections

**Use when**

Configuring network boundary routing, host validation, and CSRF protection settings for application middleware.

**Secure rules**

**Rule 1: Restrict trusted HTTP host headers to authorized domain patterns and avoid automatic wildcard subdomains.**

Configure `Middleware::trustHosts()` to validate the incoming `Host` request header against expected hostnames, disabling automatic subdomain matching when wildcard subdomains are not expected.

```php
$middleware->trustHosts(
    at: ['app.example.com'],
    subdomains: false
);
```

**Rule 2: Restrict allowSameSite to trusted cross-subdomain architectures.**

Use `PreventRequestForgery::allowSameSite()` only when subdomains sharing the same top-level domain are fully trusted, as enabling `allowSameSite` allows requests with a `Sec-Fetch-Site: same-site` header to bypass CSRF token checks.

```php
PreventRequestForgery::allowSameSite(true);
```


## Category: network boundary

### Configure trusted proxy IP addresses and forwarded headers explicitly

**Use when**

Configuring upstream proxy trust boundaries and forwarded headers within the application middleware setup.

**Secure rules**

**Rule 1: Explicitly define trusted proxy IP addresses and specify only necessary forwarded headers in middleware.**

Explicitly define trusted proxy IP addresses and specify only necessary forwarded headers in `Middleware::trustProxies()`. Avoid trusting wildcard proxies unless operating in a controlled network environment where upstream load balancers strip forged headers.

```php
$middleware->trustProxies(
    at: ['192.168.1.100', '10.0.0.1'],
    headers: Request::HEADER_X_FORWARDED_FOR | Request::HEADER_X_FORWARDED_HOST | Request::HEADER_X_FORWARDED_PORT | Request::HEADER_X_FORWARDED_PROTO
);
```


## Category: output encoding

### Verify HTML output encoding in HTTP response tests

**Use when**

Writing feature tests to verify that rendered response content is properly HTML-escaped by default in Laravel applications.

**Secure rules**

**Rule 1: Use assertSee to verify that dynamic content is properly HTML-escaped by default.**

When writing feature tests for rendered response content using `TestResponse`, use `assertSee` and `assertSeeText` to verify that dynamic content is properly HTML-escaped by default. Reserve `assertSeeHtml` specifically for testing intended unescaped HTML structure.

```php
$response = $this->get('/profile');

// Asserts that 'Alice & Bob' is rendered as 'Alice &amp; Bob' in the response HTML
$response->assertSee('Alice & Bob');

// Use assertSeeHtml only when asserting expected unescaped raw HTML markup
$response->assertSeeHtml('<span class="badge">Active</span>');
```


## Category: resource exhaustion

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


## Category: runtime environment hardening

### Disable Debug Mode and Enforce Production Environment Configuration

**Use when**

Configuring deployment environments and application bootstrapping settings to prevent the exposure of debug details, file paths, and stack traces.

**Secure rules**

**Rule 1: Set application environment to production and disable debug mode to prevent exception trace leakage.**

Ensure that `APP_ENV` is set to `production` and `APP_DEBUG` is explicitly set to `false` in production deployment environments. Gate debug utilities and verify that the application checks `$app->isProduction()` or `$app->environment('production')` during bootstrapping to prevent stack trace and internal path exposures.

```env
APP_ENV=production
APP_DEBUG=false
```


## Category: secret handling

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


## Category: security control integrity

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


## Category: session management

### Configure secure and encrypted session cookie parameters

**Use when**

Configuring session storage settings, security flags, and encryption parameters in production applications.

**Secure rules**

**Rule 1: Enforce secure and HttpOnly flags on session cookies**

Configure `SESSION_SECURE_COOKIE` to true and ensure `SESSION_HTTP_ONLY` remains true to protect session cookies against network interception and client-side script access.

```env
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true
```

**Rule 2: Encrypt session payloads at rest**

Enable the session encryption option in configuration files to wrap underlying session handlers and protect stored payloads against exposure.

```php
// config/session.php
'encrypt' => true,
```


### Manage session lifecycle states and identifiers during authentication and logout

**Use when**

Developing authentication routines, login controllers, and user logout workflows where session identifiers must be rotated and session stores invalidated.

**Secure rules**

**Rule 1: Regenerate session identifiers upon user authentication or privilege elevation**

Ensure session IDs are regenerated and old session data is deleted upon user authentication or privilege elevation by calling `$request->session()->regenerate()` to prevent session fixation attacks.

```php
use Illuminate\Support\Facades\Auth;

if (Auth::guard('web')->attempt($credentials)) {
    $request->session()->regenerate();
    return redirect()->intended('dashboard');
}
```

**Rule 2: Invalidate session store and rotate remember tokens during logout**

Call `Auth::logout()` alongside `$request->session()->invalidate()` and `$request->session()->regenerateToken()` to ensure active sessions and persistent remember tokens are fully revoked.

```php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

public function logout(Request $request)
{
    Auth::logout();

    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect('/login');
}
```

**Rule 3: Invalidate concurrent device sessions during password updates**

Call `Auth::logoutOtherDevices($password)` when users change their credentials to invalidate active sessions across other devices.

```php
use Illuminate\Support\Facades\Auth;

public function updatePassword(Request $request)
{
    $request->validate([
        'current_password' => ['required', 'current_password'],
        'password' => ['required', 'confirmed'],
    ]);

    $user = $request->user();
    $user->update(['password' => Hash::make($request->password)]);

    Auth::logoutOtherDevices($request->current_password);
}
```
