# Security cards

Repository: `https://github.com/pallets/jinja#3.1.6`
Category: output encoding

## output encoding

### Enable autoescaping and explicit filters for safe HTML output rendering

**Use when**

When rendering dynamic templates or handling untrusted user input within HTML and internationalization contexts to prevent cross-site scripting.

**Secure rules**

**Rule 1: Enable autoescaping explicitly when initializing the Jinja environment.**

Initialize the `Environment` class with `autoescape=True` or use `select_autoescape` to ensure dynamic variable values are automatically sanitized against cross-site scripting vulnerabilities.

```python
from jinja2 import Environment, FileSystemLoader, select_autoescape

env = Environment(
    loader=FileSystemLoader("templates"),
    autoescape=select_autoescape(["html", "xml"])
)
```

**Rule 2: Apply manual escaping filters when autoescaping is disabled.**

Explicitly pass untrusted dynamic variable values through the `|e` or `|escape` filter when manual escaping is used or automatic escaping is disabled in the application environment.

```html
<p>User profile: {{ user.username|e }}</p>
```

**Rule 3: Enforce HTML escaping on safe strings using forceescape.**

Use the `forceescape` filter to explicitly enforce HTML escaping on variable values, even when the underlying object implements the `__html__` interface or is already wrapped in a safe `Markup` object.

```html
<div>
  {{ untrusted_user_content | forceescape }}
</div>
```

**Rule 4: Use block-level autoescape directives for contextual output encoding.**

Use the `{% autoescape %}` statement to dynamically override or enforce autoescaping rules for specific sections of a template when handling variable contexts with varying escaping requirements.

```html
{% autoescape true %}
  <p>User bio: {{ user_bio }}</p>
{% endautoescape %}
```

**Rule 5: Enable autoescaping explicitly for templates that render HTML or XML**

Explicitly configure autoescape using autoescape=True or select_autoescape when rendering HTML or XML templates to reduce the risk of unescaped output.

```python
from jinja2 import Environment, select_autoescape

env = Environment(
    autoescape=select_autoescape(["html", "xml"])
)
```


### Sanitize and encode attributes, translations, and sequences securely

**Use when**

When processing attributes, concatenating markup sequences, or using internationalization extensions with dynamic variables in templates.

**Secure rules**

**Rule 1: Sanitize attribute keys when using the xmlattr filter.**

Pass untrusted dynamic data exclusively as dictionary values rather than dictionary keys when generating HTML attributes using the `xmlattr` filter, ensuring keys do not contain illegal characters.

```html
<ul{{ {'class': 'user-list', 'id': user_provided_id}|xmlattr }}>
  <li>User item</li>
</ul>
```

**Rule 2: Enable autoescaping for dynamic variables in i18n translation functions.**

Keep autoescaping enabled and use newstyle gettext callables via `install_gettext_callables(..., newstyle=True)` so that dynamic variable arguments passed to translation functions inside templates are safely HTML-encoded.

```python
from jinja2 import Environment

env = Environment(extensions=["jinja2.ext.i18n"], autoescape=True)
env.install_gettext_callables(
    gettext_func,
    ngettext_func,
    newstyle=True
)
```

**Rule 3: Use markup_join for safely concatenating HTML template sequences.**

Use `markup_join` or `markupsafe.Markup` instead of standard Python string concatenation or `str.join` when custom filters or runtime helpers concatenate sequences containing HTML markup or dynamic template variables.

```python
from jinja2.runtime import markup_join
from markupsafe import Markup

def render_tags(tags):
    items = [Markup("<span>"), tags, Markup("</span>")]
    return markup_join(items)
```

**Rule 4: Enable autoescape when joining list items containing untrusted strings.**

Configure the environment with `autoescape=True` so that the `join` filter automatically HTML-escapes raw string elements in a collection while preserving safe elements.

```python
from markupsafe import Markup
from jinja2 import Environment

env = Environment(autoescape=True, enable_async=True)
tmpl = env.from_string("{{ items|join(', ') }}")
```
