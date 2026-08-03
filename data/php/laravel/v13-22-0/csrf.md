# Security cards

Repository: `https://github.com/laravel/framework#v13.22.0`
Documentation repository: `https://github.com/laravel/docs#13.x`
Category: csrf

## csrf

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
