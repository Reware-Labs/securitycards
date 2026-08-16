# Security cards

Repository: `https://github.com/django/django#6.0.7`
Category: output encoding

## output encoding

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
