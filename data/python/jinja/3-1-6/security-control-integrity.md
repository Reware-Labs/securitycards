# Security cards

Repository: `https://github.com/pallets/jinja#3.1.6`
Category: security control integrity

## security control integrity

### Rely on SandboxedEnvironment to intercept format string evaluations and enforce attribute checks

**Use when**

When rendering templates that process untrusted input or use string formatting expressions that could potentially traverse object graphs and bypass standard security checks.

**Secure rules**

**Rule 1: Use SandboxedEnvironment to evaluate format strings and prevent unauthorized attribute lookups.**

Always ensure rendering runs under `SandboxedEnvironment` so that direct and indirect calls to `str.format` and format methods are properly intercepted, preventing access to forbidden properties like `__class__` or `__builtins__`.

```python
from jinja2.sandbox import SandboxedEnvironment

env = SandboxedEnvironment()
template = env.from_string('{{ "Hello {0.name}".format(user) }}')
rendered = template.render(user=user_obj)
```
