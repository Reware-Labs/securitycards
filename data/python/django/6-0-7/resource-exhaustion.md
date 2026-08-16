# Security cards

Repository: `https://github.com/django/django#6.0.7`
Category: resource exhaustion

## resource exhaustion

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
