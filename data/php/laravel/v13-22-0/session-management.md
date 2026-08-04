# Security cards

Repository: `https://github.com/laravel/framework#v13.22.0`
Documentation repository: `https://github.com/laravel/docs#13.x`
Category: session management

## session management

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
