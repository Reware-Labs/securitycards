# Security cards

Repository: `https://github.com/django/django#6.0.7`
Category: input contract definition

## input contract definition

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

**Rule 1: Call full_clean() explicitly on model instances before saving to ensure field validators are executed.**

Invoking `save()` directly on a model instance does not trigger model validation. Always call `full_clean()` prior to saving to reject malformed data and unvalidated inputs.

```python
from django.core.exceptions import ValidationError
from myapp.models import BinaryDataModel

try:
    instance = BinaryDataModel(data=user_provided_bytes)
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
