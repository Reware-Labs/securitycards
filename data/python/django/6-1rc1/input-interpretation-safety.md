# Security cards

Repository: `https://github.com/django/django#6.0.7`
Category: input interpretation safety

## input interpretation safety

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
