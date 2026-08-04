# Security cards

Repository: `https://github.com/django/django#6.0.7`
Category: secret handling

## secret handling

### Load Secret Keys Securely from External Environments

**Use when**

Configuring Django settings and application credentials in production or deployment environments.

**Secure rules**

**Rule 1: Load SECRET_KEY and sensitive backend credentials from environment variables or secure secret managers.**

Never hardcode sensitive values or commit them to source control. Fetch `SECRET_KEY`, email credentials, and cache credentials dynamically using `os.environ` or external management tools.

```python
import os

SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]
SECRET_KEY_FALLBACKS = os.environ.get("DJANGO_SECRET_KEY_FALLBACKS", "").split(",")
```

**Rule 2: Configure SECRET_KEY_FALLBACKS to support safe secret key rotation**

Define fallback keys using `SECRET_KEY_FALLBACKS` during secret key rotation so Django can continue validating signed data, session cookies, and tokens created under previous keys without breaking active sessions.

```python
SECRET_KEY = os.environ["CURRENT_SECRET_KEY"]
SECRET_KEY_FALLBACKS = [
    os.environ["OLD_SECRET_KEY"],
]
```


### Redact and Mask Sensitive Data in Exception Reports and Logs

**Use when**

Handling debugging, logging, and error reporting configurations in Django applications.

**Secure rules**

**Rule 1: Apply sensitive data decorators to view functions handling credentials.**

Annotate sensitive view functions and internal callables with `@sensitive_post_parameters` and `@sensitive_variables` to prevent passwords, secret tokens, and API keys from leaking into exception reports or stack trace logs.

```python
from django.views.decorators.debug import sensitive_post_parameters, sensitive_variables

@sensitive_post_parameters('password', 'credit_card')
def login_view(request):
    ...

@sensitive_variables('auth_token', 'private_key')
def authenticate_service(auth_token, private_key):
    ...
```

**Rule 2: Configure safe exception reporter filters for metadata sanitation.**

Use `DEFAULT_EXCEPTION_REPORTER_FILTER` configured to `SafeExceptionReporterFilter` to sanitize sensitive fields in request metadata and settings during debug or exception reporting.

```python
DEFAULT_EXCEPTION_REPORTER_FILTER = 'django.views.debug.SafeExceptionReporterFilter'
```
