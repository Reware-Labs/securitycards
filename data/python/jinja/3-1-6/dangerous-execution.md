# Security cards

Repository: `https://github.com/pallets/jinja#3.1.6`
Category: dangerous execution

## dangerous execution

### Restrict Dynamic Import Paths and Environment Extensions to Static or Allowlisted Values

**Use when**

Configuring Jinja environment extensions or resolving dynamic helper strings that use `import_string` or extension loading mechanisms.

**Secure rules**

**Rule 1: Use explicit extension classes or static import strings instead of passing unvalidated user input into environment extensions**

When creating an `Environment` or calling `add_extension`, always provide explicit extension classes or static, hardcoded import strings. Never pass untrusted user input, attacker-controlled or untrusted strings directly into the extensions argument to prevent attackers from triggering arbitrary Python module imports.

```python
from jinja2 import Environment
from jinja2.ext import i18n

# Pass explicit extension classes or static module paths
env = Environment(
    extensions=[i18n]
)
```

**Rule 2: Validate user input against a strict allowlist before passing it to import_string.**

Do not pass user-supplied strings or unvalidated input directly into `import_string`, as it dynamically imports modules and resolves object attributes using Python builtins. Always check user keys against an explicit allowlist mapping to trusted helper paths before resolution.

```python
from jinja2.utils import import_string

ALLOWED_HELPERS = {
    "date_format": "myapp.helpers.date_format",
    "string_clean": "myapp.helpers.string_clean",
}

def get_helper(user_key: str):
    if user_key not in ALLOWED_HELPERS:
        raise ValueError("Unauthorized helper key")
    return import_string(ALLOWED_HELPERS[user_key])
```
