# Security cards

Repository: `https://github.com/django/django#6.0.7`
Category: security control integrity

## security control integrity

### Order Middleware Components Correctly in Settings

**Use when**

Configuring the `MIDDLEWARE` setting in Django applications where security controls depend on state established by upstream middleware.

**Secure rules**

**Rule 1: Place state-dependent middleware after its required provider middleware**

Ensure AuthenticationMiddleware is listed after `SessionMiddleware`. Place `CsrfViewMiddleware` after `SessionMiddleware` when `CSRF_USE_SESSIONS=True`.

```python
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
```
