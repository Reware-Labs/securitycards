# Security cards

Repository: `https://github.com/django/django#6.1rc1`

## Category: access control

### Enforce View-Level Permissions and Authorization Checks

**Use when**

Protecting function-based views or class-based views to ensure only authenticated and authorized users can access specific functionality or resources.

**Secure rules**

**Rule 1: Pass an iterable of permission codenames to the permission_required decorator when a view requires multiple permissions.**

Use `permission_required` from `django.contrib.auth.decorators` and provide a list or iterable of required permission codenames to prevent unauthorized access to privileged functionality.

```python
from django.contrib.auth.decorators import permission_required

@permission_required(["polls.add_choice", "polls.change_choice"])
def edit_choice_view(request):
    # View logic requiring both permissions
    pass
```

**Rule 2: Inherit from authentication and permission mixins when securing class-based views.**

Use `LoginRequiredMixin`, `PermissionRequiredMixin`, or `UserPassesTestMixin` from `django.contrib.auth.mixins` to enforce authentication and access control rules before executing class-based view logic.

```python
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.views.generic import View

class ProtectedView(LoginRequiredMixin, PermissionRequiredMixin, View):
    permission_required = 'polls.can_vote'
    permission_denied_message = 'You do not have permission to access this page.'
    raise_exception = True
```

**Rule 3: Set raise_exception=True when using permission_required to return an HTTP 403 Forbidden response.**

Configure `permission_required` with `raise_exception=True` so that authenticated users lacking required permissions receive an HTTP 403 Forbidden exception instead of being redirected to a login page.

```python
from django.contrib.auth.decorators import permission_required
from django.utils.decorators import method_decorator

@permission_required('auth.add_user', raise_exception=True)
def add_user_view(request):
    return HttpResponse('User creation view')
```


### Restrict Data Access and Form Fields by Request User

**Use when**

Rendering admin forms or relational choices to ensure users only view or interact with authorized records and tenant data.

**Secure rules**

**Rule 1: Restrict related model choices in admin forms based on the active request user.**

Override `formfield_for_foreignkey` in your `ModelAdmin` class to filter querysets using `request.user` and prevent users from selecting records belonging to other users or tenants.

```python
class CarTireAdmin(admin.ModelAdmin):
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "car" and not request.user.is_superuser:
            kwargs["queryset"] = Car.objects.filter(owner=request.user)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
```


## Category: api contract misuse

### Pass blind recipients using the dedicated bcc argument

**Use when**

When configuring email messages with blind carbon copy recipients using `EmailMessage`.

**Secure rules**

**Rule 1: Provide blind recipients via the dedicated bcc keyword argument rather than custom headers.**

Do not include a `Bcc` key inside the custom headers dictionary passed to `EmailMessage`. Django explicitly disallows setting `Bcc` in headers and raises a `ValueError` to enforce proper recipient handling. Always pass blind carbon copy email addresses using the dedicated `bcc` argument.

```python
email = EmailMessage(
    subject='Notification',
    body='Internal update',
    from_email='admin@example.com',
    to=['user@example.com'],
    bcc=['audit@example.com'],
)
```


## Category: authentication

### Enforce Strict Token Lifespan and Authentication Validation

**Use when**

When handling account recovery tokens, session authentication logins, and user verification workflows.

**Secure rules**

**Rule 1: Configure strict expiration durations for password reset tokens.**

Set `PASSWORD_RESET_TIMEOUT` in settings to enforce an appropriate lifespan for generated recovery tokens and reduce the window of exposure for token misuse.

```python
PASSWORD_RESET_TIMEOUT = 86400
```

**Rule 2: Pass the user instance returned by authenticate() to login() or alogin()**

Explicitly pass authenticated user objects to `login()` and `alogin()` rather than relying on implicit fallbacks to avoid logic bugs and unintended session mutations.

```python
from django.contrib.auth import authenticate, login

user = authenticate(request, username=username, password=password)
if user is not None:
    login(request, user)
```


### Verify Passwords and Configure Hashing Parameters

**Use when**

When managing user passwords, verifying credentials, or configuring password hashing algorithms in authentication workflows.

**Secure rules**

**Rule 1: Verify passwords securely using supported password hashing mechanisms and handle legacy hash upgrades**

Always use library-supported password-hashing verifiers and pass a setter callback to `check_password` or `acheck_password` to automatically upgrade legacy password hashes upon successful authentication.

```python
def login_user(user, raw_password):
    def password_setter(raw_password):
        user.set_password(raw_password)
        user.save(update_fields=['password'])

    if check_password(raw_password, user.password, setter=password_setter):
        return user
    return None
```

**Rule 2: Configure strong password hashers to prevent password truncation and dictionary attacks.**

Configure secure password hashers such as `BCryptSHA256PasswordHasher` or `ScryptPasswordHasher` in `PASSWORD_HASHERS` to ensure passwords are fully evaluated and protected against hardware-accelerated cracking.

```python
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.ScryptPasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
]
```


## Category: boundary control

### Configure SECURE_PROXY_SSL_HEADER safely behind a trusted proxy

**Use when**

Deploying Django behind a reverse proxy to handle secure connection transitions at the server boundary.

**Secure rules**

**Rule 1: Only enable SECURE_PROXY_SSL_HEADER when running behind a trusted reverse proxy that strips incoming header values from untrusted clients.**

Set `SECURE_PROXY_SSL_HEADER` only if your reverse proxy strictly sanitizes and strips any user-supplied header matching the configured proxy SSL header. Failing to do so allows untrusted clients to spoof secure connections at the application boundary.

```python
# Only use behind a trusted reverse proxy that sanitizes request headers
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
```


## Category: cryptography

### Secure Password Hashing and Work Factor Configuration

**Use when**

Configuring password storage and handling user credentials securely in Django applications.

**Secure rules**

**Rule 1: Always hash user passwords using Django's authentication creation APIs rather than setting plaintext values directly.**

Do not assign plaintext strings directly to the user model's password attribute. Instead, use `User.objects.create_user()` for user creation or `user.set_password()` when modifying passwords to ensure credentials are stored securely with cryptographic hashing.

```python
from django.contrib.auth.models import User

user = User.objects.create_user("john", "john@example.com", "raw_password")
user.set_password("new_raw_password")
user.save()
```

**Rule 2: List robust hashers such as Argon2PasswordHasher at the start of PASSWORD_HASHERS**

List robust hashers such as `Argon2PasswordHasher` or configured `PBKDF2PasswordHasher` subclasses at the beginning of `PASSWORD_HASHERS`. Maintain secondary hashers in the list to ensure legacy user hashes can be verified and automatically upgraded upon successful login.

```python
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
]
```


### Sign and Verify Payload Data Using Cryptographic Signatures and Salts

**Use when**

Signing and verifying sensitive data, cookies, and tokens to ensure integrity and authenticity.

**Secure rules**

**Rule 1: Namespace cryptographic signatures using unique salt values and enforce expiration on time-sensitive payloads**

Supply a unique `salt` parameter when instantiating TimestampSigner for time-sensitive payloads to prevent cross-context replay attacks. Always enforce a strict `max_age` during signature verification via `unsign()` or `request.get_signed_cookie()` to reject expired tokens and tampered payloads.

```python
from datetime import timedelta
from django.core.signing import TimestampSigner, SignatureExpired, BadSignature

signer = TimestampSigner(salt="password-reset")

try:
    user_id = signer.unsign(token, max_age=timedelta(minutes=15))
except (SignatureExpired, BadSignature):
    pass
```


## Category: csrf

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


## Category: deserialization

### Use safe JSON serialization for session data and signed objects

**Use when**

When configuring session serialization or handling signed objects and payloads to prevent unsafe arbitrary object construction and remote code execution.

**Secure rules**

**Rule 1: Configure session serialization to use JSON serialization rather than pickle-based serializers**

Keep SESSION_SERIALIZER configured to use django.contrib.sessions.serializers.JSONSerializer, do not introduce a custom serializer that performs unsafe object deserialization, such as pickle.loads().

```python
# settings.py
SESSION_SERIALIZER = 'django.contrib.sessions.serializers.JSONSerializer'
```

**Rule 2: Rely on built-in JSON-based signing functions for structured objects.**

Use `Signer.sign_object()`, `unsign_object()`, `signing.dumps()`, and `signing.loads()`, which use `JSONSerializer` by default, rather than custom untrusted object deserializers like pickle.

```python
from django.core import signing

# Uses JSON serialization safely under the hood
signed_data = signing.dumps({"user_id": 42, "action": "download"}, salt="user-action")

# Verification decodes JSON safely without arbitrary code execution risk
payload = signing.loads(signed_data, salt="user-action", max_age=3600)
```


## Category: file handling

### Control File Overwriting in FileSystemStorage

**Use when**

When configuring file storage options to prevent user-controlled or colliding filenames from overwriting existing assets or data files.

**Secure rules**

**Rule 1: Explicitly control file overwriting behavior using allow_overwrite on FileSystemStorage.**

Set the `allow_overwrite` parameter when initializing `FileSystemStorage` to prevent unintended overwriting of existing files by user-uploaded content.

```python
from django.core.files.storage import FileSystemStorage

# Prevent overwriting existing files on save
storage = FileSystemStorage(allow_overwrite=False)
```


### Securely Configure Static File Storage and Asset Collection

**Use when**

Developing, configuring, and deploying static files and asset collection pipelines in Django applications.

**Secure rules**

**Rule 1: Use the `find_all=True` parameter when programmatically retrieving all matching static files.**

When using `django.contrib.staticfiles.finders.find()`, pass `find_all=True` to collect all matching locations. Avoid the removed legacy `all` parameter.

```python
from django.contrib.staticfiles import finders

matching_files = finders.find("css/base.css", find_all=True)
```

**Rule 2: Configure explicit non-empty directory roots for static file storage backends**

Ensure finder storage instances are configured with explicit, non-empty root directory paths to prevent fallback to the process working directory.

```python
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
STORAGES["default"]["OPTIONS"] = {"location": BASE_DIR / "media"}
MEDIA_ROOT = BASE_DIR / "media"
```

**Rule 3: Enforce valid static asset references and prevent missing file deployment failures.**

Verify that all referenced static asset paths inside CSS and JS exist prior to running `collectstatic` with `ManifestStaticFilesStorage` to avoid broken builds.

```python
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.ManifestStaticFilesStorage",
    },
}
```

**Rule 4: Exclude sensitive files, backups, and version control metadata during static asset collection**

Rely on default ignore patterns or specify custom `ignore_patterns` in a custom StaticFilesConfig subclass to prevent copying confidential files to the public `STATIC_ROOT` directory.

```python
from django.apps import AppConfig

class MyAppConfig(AppConfig):
    name = 'myapp'
    ignore_patterns = ['*.env', '*.bak', '*~', '.git*']
```

**Rule 5: Prevent infinite loops during static file post-processing.**

Ensure CSS and JS assets do not contain circular file references when using post-processing storages, and configure `max_post_process_passes` safely if custom logic is required.

```python
from django.contrib.staticfiles.storage import ManifestStaticFilesStorage

class CustomStaticStorage(ManifestStaticFilesStorage):
    max_post_process_passes = 5
```

**Rule 6: Avoid serving static files in production using insecure development handlers.**

Collect static assets into `STATIC_ROOT` and serve them directly via a dedicated web server, reverse proxy, or cloud storage backend instead of using Django's development server in production.

```python
from pathlib import Path
from django.conf import STATICFILES_STORAGE_ALIAS

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATIC_URL = '/static/'

STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    STATICFILES_STORAGE_ALIAS: {
        'BACKEND': 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage',
    },
}
```


## Category: injection

### Use Parameterized Queries and Structured Expressions for Database Operations

**Use when**

Building database queries with Django QuerySets, raw SQL strings, or expression functions where untrusted user input is involved.

**Secure rules**

**Rule 1: Use QuerySet parameterization or parameterized raw queries instead of concatenating untrusted strings into SQL statements.**

Rely on Django `QuerySet` parameterization or raw queries with explicit parameter bindings such as `%s` to prevent arbitrary SQL execution. Avoid direct string formatting or raw queries like `extra()` and `RawSQL` without parameterized inputs.

```python
Entry.objects.filter(title=user_input)

Entry.objects.raw('SELECT * FROM myapp_entry WHERE title = %s', [user_input])
```

**Rule 2: Pass untrusted input to database function expressions safely via positional arguments or Value wrappers.**

Do not pass untrusted user input as keyword arguments `**extra`, `extra_context`, or expression parameters like `output_field` to `Func()` or database function expressions because they interpolate directly into SQL templates. Use positional expression arguments or `Value()` wrappers instead so Django passes them as query parameters.

```python
queryset.annotate(field_lower=Func(Value(user_input), function="LOWER"))
```


## Category: input contract definition

### Secure URL Routing, Parameter Validation, and Host Validation in Django

**Use when**

When defining URL patterns, configuring path converters, implementing custom converters, or handling request host verification.

**Secure rules**

**Rule 1: Explicitly anchor regular expression patterns in `re_path()` with start and end anchors.**

When using `re_path()` to define URL patterns, explicitly anchor regular expressions using `^` and `$` to enforce full-path matching against `request.path_info` and prevent partial matching vulnerabilities.

```python
from django.urls import re_path
from views import bio

urlpatterns = [
    re_path(r'^bio/(?P<username>\w+)/$', bio, name='bio'),
]
```

**Rule 2: Constrain URL parameters using explicit typed path converters or strict character sets.**

When defining route patterns with `path()`, specify explicit typed path converters like `<int:section>` or use non-capturing groups in `re_path()` to validate parameter formats automatically during request routing.

```python
from django.urls import path
from views import article_section

urlpatterns = [
    path('articles/<slug:title>/<int:section>/', article_section, name='article-section'),
]
```

**Rule 3: Raise `ValueError` in custom URL converters to trigger 404 routing decisions.**

When implementing custom URL path converters or validation logic, raise `ValueError` inside the converter's `to_python()` method to signal invalid parameters so that Django's URL resolver catches it and treats the request as a non-matching path.

```python
from django.urls import register_converter

class TinyIntConverter:
    regex = r'[0-9]+'

    def to_python(self, value):
        val = int(value)
        if val > 5:
            raise ValueError('Value out of range for route matching')
        return val

    def to_url(self, value):
        return str(value)

register_converter(TinyIntConverter, 'tiny_int')
```

**Rule 4: Configure `ALLOWED_HOSTS` strictly and retrieve host names using `HttpRequest.get_host()`.**

Ensure `ALLOWED_HOSTS` explicitly lists all allowed hostnames and domain names served by the application, and always rely on `HttpRequest.get_host()` rather than reading the Host header directly from `request.META` to protect against Host header attacks.

```python
ALLOWED_HOSTS = [
    'example.com',
    'www.example.com',
    '.example.com',
]

def my_view(request):
    domain = request.get_host()
```


### Validate and Clean Model Inputs Before Database Persistence

**Use when**

Populating model attributes programmatically outside of Django Forms or handling custom field inputs prior to saving model instances.

**Secure rules**

**Rule 1: Call full_clean() explicitly on model instances before saving to ensure field validators and base64 constraints are executed.**

Invoking `save()` directly on a model instance does not trigger model validation. Always call `full_clean()` prior to saving to reject malformed data, invalid Base64 encodings in `BinaryField`, and unvalidated inputs.

```python
from django.core.exceptions import ValidationError
from myapp.models import BinaryDataModel

try:
    instance = BinaryDataModel(data=user_provided_base64_string)
    instance.full_clean()
    instance.save()
except ValidationError:
    pass
```

**Rule 2: Use form cleaned_data to strip unvalidated extra input parameters.**

When processing HTTP request inputs with Django Forms, always use `form.cleaned_data` instead of reading from `request.POST` or `form.data` directly to ensure extra unexpected parameters are filtered out.

```python
class ProfileForm(forms.Form):
    first_name = forms.CharField()
    last_name = forms.CharField()

form = ProfileForm(request.POST)
if form.is_valid():
    user_info = form.cleaned_data
```

**Rule 3: Enforce strict username formatting validators to reject whitespace and control characters.**

Apply `UnicodeUsernameValidator` or `ASCIIUsernameValidator` to form fields and custom user models to restrict username formatting and actively reject trailing line breaks and whitespace injection.

```python
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.db import models

class CustomUser(models.Model):
    username = models.CharField(
        max_length=150,
        unique=True,
        validators=[UnicodeUsernameValidator()],
    )
```


## Category: input interpretation safety

### Normalize and Validate Unicode User Inputs and Handles

**Use when**

Handling user-provided strings, handles, or registration data that require canonical representation and unambiguous interpretation.

**Secure rules**

**Rule 1: Apply Unicode NFKC normalization and case-insensitive validation to user identifiers.**

Use built-in components like `UserCreationForm` or ensure custom logic applies NFKC normalization and case-insensitive checks to prevent visually identical or duplicate user handles.

```python
from django.contrib.auth.forms import UserCreationForm

class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        fields = ('username', 'email')
```

**Rule 2: Handle database integrity errors resulting from normalized duplicate entries.**

Catch `django.db.IntegrityError` when creating users with arbitrary Unicode strings, as canonical normalization may map distinct inputs to identical database values.

```python
from django.contrib.auth import get_user_model
from django.db import IntegrityError

User = get_user_model()

try:
    user = User.objects.create_user(username=user_provided_username)
except IntegrityError:
    form.add_error("username", "This username is already taken.")
```

**Rule 3: Prohibit null characters in string inputs.**

Validate and disallow null characters in string inputs using `ProhibitNullCharactersValidator` or standard `CharField` form field validation to prevent unexpected truncation or driver exceptions.

```python
from django import forms
from django.core.validators import ProhibitNullCharactersValidator

class UserInputForm(forms.Form):
    comment = forms.CharField(validators=[ProhibitNullCharactersValidator()])
```


## Category: interface protocol hardening

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


## Category: network boundary

### Verify SMTP TLS Certificates and Hostnames in Email Connections

**Use when**

Configuring Django's email backend to send messages securely over SMTP.

**Secure rules**

**Rule 1: Maintain default TLS certificate and hostname verification for SMTP email connections.**

Use standard settings for secure SMTP email delivery by setting `EMAIL_BACKEND` to `django.core.mail.backends.smtp.EmailBackend`, enabling `EMAIL_USE_TLS`, and specifying the correct `EMAIL_PORT`. Avoid overriding the `ssl_context` property to disable certificate or hostname checks.

```python
# settings.py
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_USE_TLS = True
EMAIL_PORT = 587
```


## Category: output encoding

### Escape Untrusted Content and Use Safe HTML Construction Helpers in Templates and Custom Tags

**Use when**

When rendering dynamic user input, constructing custom template tags or filters, or embedding data into HTML templates and attributes.

**Secure rules**

**Rule 1: Explicitly escape untrusted content using escaping utilities and built-in template filters to prevent cross-site scripting.**

Always pass untrusted user input or sequences through escaping mechanisms such as `escape()`, `conditional_escape()`, `escapeseq`, or Django's built-in autoescape machinery before rendering them into templates or custom components.

```python
from django.utils.html import escape

escaped_title = escape(user_provided_title)
```

**Rule 2: Construct dynamic HTML in custom tags and filters using format_html instead of manual string formatting with mark_safe**

When writing custom template tags or filters that output dynamic HTML snippets, use `format_html()` to automatically apply `conditional_escape()` to arguments. When writing custom filters that manually handle escaping, set needs_autoescape=True and use the provided autoescape state.

```python
from django import template
from django.utils.html import format_html

register = template.Library()

@register.simple_tag
def user_profile_link(username, profile_url):
    return format_html('<a href="{}">{}</a>', profile_url, username)
```


## Category: resource exhaustion

### Enforce Input Size Limits and Absolute Ceilings on Forms and Formsets

**Use when**

When building forms, formsets, or handling request payloads that process untrusted user input.

**Secure rules**

**Rule 1: Set absolute_max and validate limits on formsets to mitigate memory exhaustion from untrusted POST data.**

Specify the `absolute_max` parameter and `max_num` with `validate_max=True` when creating formsets using `formset_factory` to enforce a strict ceiling on the number of forms instantiated from untrusted input.

```python
from django.forms import formset_factory
from myapp.forms import ArticleForm

ArticleFormSet = formset_factory(
    ArticleForm,
    max_num=10,
    absolute_max=20,
    validate_max=True
)
```

**Rule 2: Constrain untrusted input size processed by template filters and request bodies.**

Enforce strict length limits on user input fields in forms before processing or rendering them with templates, and restrict request body sizes at the web server level alongside Django upload size settings.

```python
class ArticleForm(forms.Form):
    content = forms.CharField(max_length=50000)
```


## Category: runtime environment hardening

### Disable Debug Mode and Use Production WSGI/ASGI Servers

**Use when**

Preparing Django applications for production deployment and configuring runtime settings.

**Secure rules**

**Rule 1: Set DEBUG to False and avoid using the development server in production.**

Ensure that `DEBUG = False` is configured in production settings to prevent leaking sensitive system information, local variables, and tracebacks. Never use `runserver` in production environments; instead, deploy the application using a production-grade WSGI or ASGI server like Gunicorn.

```python
# settings.py
DEBUG = False

# Run via production WSGI server
gunicorn myproject.wsgi:application --bind 127.0.0.1:8000
```


## Category: secret handling

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


## Category: security control integrity

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


## Category: session management

### Enforce Secure Cookie Attributes for Session Management

**Use when**

Configuring session cookies and production settings to ensure cookies are transmitted securely and protected against interception or client-side extraction.

**Secure rules**

**Rule 1: Enable boolean secure and HTTP-only session cookies**

Configure `SESSION_COOKIE_SECURE` and `SESSION_COOKIE_HTTPONLY` as boolean `True` in production settings to prevent browsers from transmitting session identifiers over unencrypted HTTP connections and to block client-side scripts from accessing them.

```python
# settings.py for production
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
```


### Rotate and Flush Sessions During Authentication and Security State Changes

**Use when**

Handling user login, logout, password updates, or authentication state transitions where session identifiers must be rotated or invalidated to prevent session fixation and reuse.

**Secure rules**

**Rule 1: Cycle session keys upon authentication state changes**

Call `request.session.cycle_key()` whenever a user logs in or when their privilege level changes to generate a new session key while maintaining the session payload and mitigating session fixation attacks.

```python
def login_view(request):
    # Perform user authentication checks...
    request.session.cycle_key()
    request.session['user_id'] = user.id
```

**Rule 2: Flush session data completely on logout**

Use `request.session.flush()` on user logout to delete all current session data from the backend and purge the session cookie from the client, preventing session leakage and replay.

```python
def logout_view(request):
    request.session.flush()
    return HttpResponse('Logged out')
```

**Rule 3: Rotate session keys when updating user passwords**

Call update_session_auth_hash(request, user) after an authenticated user changes their password to rotate the current session key while keeping that session valid; other sessions are invalidated by the password change.

```python
from django.contrib.auth import update_session_auth_hash

def change_password_view(request):
    if form.is_valid():
        user = form.save()
        update_session_auth_hash(request, user)
```
