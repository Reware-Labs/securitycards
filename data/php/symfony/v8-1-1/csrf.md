# Security cards

Repository: `https://github.com/symfony/symfony#v8.1.1`
Category: csrf

## csrf

### Configure Framework CSRF Protection and Token Validation

**Use when**

When configuring framework CSRF protection, form login authentication, or validating custom state-changing requests.

**Secure rules**

**Rule 1: Enable framework CSRF protection and validate tokens using `isCsrfTokenValid()` or `CsrfTokenManagerInterface::isTokenValid()`.**

Ensure `framework.csrf_protection` is enabled in configuration and validate submitted tokens with constant-time comparison methods to prevent forgery attacks.

```yaml
framework:
    csrf_protection:
        enabled: true
        stateless_token_ids: ['submit_form_action']
        check_header: true
        cookie_name: 'csrf-token'
```
