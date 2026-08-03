# Security cards

Repository: `https://github.com/pallets/jinja#3.1.6`
Category: input interpretation safety

## input interpretation safety

### Wrap static template syntax in raw blocks

**Use when**

When templates contain literal Jinja delimiters or front-end framework placeholders that should be interpreted strictly as literal text rather than being parsed and executed.

**Secure rules**

**Rule 1: Wrap literal template delimiters in raw blocks to prevent server-side parser interpretation.**

When templates include client-side framework placeholders or literal Jinja delimiters such as `{{` or `{%`, encapsulate those sections inside `{% raw %}` and `{% endraw %}` blocks. This ensures the lexer treats the text literally and avoids unexpected `TemplateSyntaxError` exceptions or parser differential issues during interpretation.

```python
from jinja2 import Environment

env = Environment()
template = env.from_string("{% raw %}Hello {{ client_side_var }}{% endraw %}")
rendered = template.render()
```
