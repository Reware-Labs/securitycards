# Security cards

Repository: `https://github.com/symfony/symfony#v8.1.1`
Category: session management

## session management

### Configure Session Fixation Protection and Cookie Security Parameters

**Use when**

When configuring application security firewalls and framework session settings for user authentication and cookie attributes.

**Secure rules**

**Rule 1: Enable session fixation protection and secure cookie attributes in security and framework configurations.**

Keep the `session_fixation_strategy` set to `migrate` or `invalidate` to prevent session fixation attacks. Configure remember-me and session cookie parameters to enforce HTTPS, protect against client-side script theft by setting `httponly` to `true`, and ensure `secure` is set to `true` or `auto` alongside an appropriate `samesite` directive.

```yaml
security:
    session_fixation_strategy: migrate
    firewalls:
        main:
            remember_me:
                secret: '%kernel.secret%'
                secure: true
                httponly: true
                samesite: 'lax'

framework:
    session:
        name: 'CUSTOM_SESS_ID'
        cookie_secure: 'auto'
        cookie_samesite: 'lax'
```


### Handle Persistent Remember-Me Token Theft and Session Invalidation

**Use when**

When managing persistent session remember-me tokens, persistent session revocation, and detecting potential cookie theft.

**Secure rules**

**Rule 1: Handle CookieTheftException to invalidate compromised token series and enforce persistent remember-me token handling.**

When using PersistentRememberMeHandler for persistent session handling, catch `CookieTheftException` when an unexpected token value is presented for a valid series ID. Invalidate the compromised token series and reset the authentication context to prevent session hijacking.

```php
use Symfony\Component\Security\Http\RememberMe\PersistentRememberMeHandler;
use Symfony\Component\Security\Core\Exception\CookieTheftException;

try {
    $handler->consumeRememberMeCookie($rememberMeDetails);
} catch (CookieTheftException $e) {
    $tokenProvider->deleteTokenBySeries($rememberMeDetails->getSeries());
}
```
