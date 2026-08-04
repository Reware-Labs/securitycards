# Security cards

Repository: `https://github.com/pallets/jinja#3.1.6`
Category: boundary control

## boundary control

### Use ImmutableSandboxedEnvironment to block state mutation

**Use when**

Rendering untrusted templates where data structures and application state must be protected against modification during execution.

**Secure rules**

**Rule 1: Instantiate `ImmutableSandboxedEnvironment` to prevent templates from calling mutating methods on built-in types.**

When processing untrusted templates that must not modify input data, instantiate `ImmutableSandboxedEnvironment` instead of standard environments. This enforces boundaries by raising a `SecurityError` if any template attempts to execute mutating operations like `append()`, `clear()`, or `pop()` on lists and dictionaries.

```python
from jinja2.sandbox import ImmutableSandboxedEnvironment
from jinja2.exceptions import SecurityError

env = ImmutableSandboxedEnvironment()
template = env.from_string('{{ items.append(1) }}')
try:
    template.render(items=[])
except SecurityError:
    pass
```
