# Security cards

Repository: `https://github.com/django/django#6.0.7`
Category: interface protocol hardening

## interface protocol hardening

### Configure SecurityMiddleware and Response Headers

**Use when**

Configuring transport security, MIME-sniffing protection, referrer policies, and cross-origin isolation headers for web applications.

**Secure rules**

**Rule 1: Include SecurityMiddleware in the middleware stack and configure security header settings.**

Add `django.middleware.security.SecurityMiddleware` to `MIDDLEWARE` and set values for HSTS, MIME-sniffing protection, referrer policies, and COOP headers in `settings.py`.

```python
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    # ...
]

SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
```

**Rule 2: Enable XFrameOptionsMiddleware for clickjacking protection.**

Ensure `django.middleware.clickjacking.XFrameOptionsMiddleware` is present in `MIDDLEWARE` to automatically attach the `X-Frame-Options` response header.

```python
MIDDLEWARE = [
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
```

**Rule 3: Configure Content Security Policy middleware and settings securely.**

Use `ContentSecurityPolicyMiddleware` with dictionary-based `SECURE_CSP` configurations and include the CSP context processor if using nonces.

```python
from django.utils.csp import CSP

MIDDLEWARE = [
    "django.middleware.csp.ContentSecurityPolicyMiddleware",
]

SECURE_CSP = {
    "default-src": [CSP.SELF],
    "script-src": [CSP.SELF, CSP.NONCE],
}
```


### Enforce HTTP Method and Request Content Type Requirements

**Use when**

Developing or configuring endpoints that process state-changing operations and incoming HTTP requests.

**Secure rules**

**Rule 1: Enforce the expected HTTP method and content type before dispatching a request.**

Ensure state-changing forms and operations explicitly use the `POST` HTTP method and handle processing under `POST` request checks to prevent protocol confusion and unauthorized cross-interface abuse.

```html
<form action="/submit/" method="post">
    {% csrf_token %}
    {{ form }}
    <input type="submit" value="Submit">
</form>
```
