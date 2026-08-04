# Security cards

Repository: `https://github.com/pallets/jinja#3.1.6`
Category: access control

## access control

### Enforce Sandbox Restrictions and Access Controls for Untrusted Templates

**Use when**

When rendering untrusted user-supplied templates or exposing Python objects and functions to templates where unauthorized actions, side effects, or cross-boundary data access must be prevented.

**Secure rules**

**Rule 1: Use SandboxedEnvironment to restrict dangerous attribute access and methods when executing untrusted templates.**

Initialize templates using `SandboxedEnvironment` to automatically intercept attribute lookups and block access to private dunder attributes like `__class__` and unsafe methods. Limit context data to required objects only.

```python
from jinja2.sandbox import SandboxedEnvironment

env = SandboxedEnvironment()
template = env.from_string('{{ user.name }}')
result = template.render(user=user_object)
```

**Rule 2: Mark state-changing or sensitive functions with the unsafe decorator.**

Decorate sensitive or mutating Python callables exposed to templates using the `@unsafe` decorator or by setting `alters_data = True`. This ensures `SandboxedEnvironment` raises a `SecurityError` if an untrusted template attempts to invoke them.

```python
from jinja2.sandbox import SandboxedEnvironment, unsafe

@unsafe
def delete_user_record(user_id):
    pass

env = SandboxedEnvironment()
env.globals['delete_user'] = delete_user_record
```
