# Security cards

Repository: `https://github.com/django/django#6.0.7`
Category: csrf

## csrf

### Enable Global CSRF Middleware and Configure Trusted Origins

**Use when**

Developing Django web applications that process state-changing requests and require cross-origin or standard form submission protection against cross-site request forgery.

**Secure rules**

**Rule 1: Keep CsrfViewMiddleware active in settings and configure trusted origins for cross-origin requests**

Include `django.middleware.csrf.CsrfViewMiddleware` in your `MIDDLEWARE` setting to protect unsafe HTTP methods. When accepting unsafe requests from trusted origins, configure CSRF_TRUSTED_ORIGINS with full origins, including the scheme, or subdomain wildcards.

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
]

CSRF_TRUSTED_ORIGINS = [
    'https://subdomain.example.com',
    'https://*.example.com',
]
```


### Include CSRF Token Tags in Forms and Retrieve Tokens Securely

**Use when**

Rendering templates with POST forms and executing JavaScript AJAX requests when HTTP-only or session-based CSRF cookies are enabled.

**Secure rules**

**Rule 1: Include the csrf_token template tag in POST forms and retrieve tokens from the DOM when HTTP-only cookies are enabled.**

Add the `{% csrf_token %}` tag inside form elements that submit data to internal endpoints. When `CSRF_COOKIE_HTTPONLY` or `CSRF_USE_SESSIONS` is enabled, query the CSRF token from the DOM input element rather than reading `document.cookie`.

```html
<form method="post" action="/internal-path/">
    {% csrf_token %}
    <button type="submit">Submit</button>
</form>

<script>
const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
</script>
```
