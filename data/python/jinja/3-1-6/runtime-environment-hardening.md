# Security cards

Repository: `https://github.com/pallets/jinja#3.1.6`
Category: runtime environment hardening

## runtime environment hardening

### Configure StrictUndefined and Sandbox Environments in Production

**Use when**

Configuring Jinja environments in production to restrict runtime behavior and disable unsafe debugging output.

**Secure rules**

**Rule 1: Use StrictUndefined when missing template variables must cause rendering to fail**

Configure `StrictUndefined` as the undefined strategy in production environments to raise an exception on missing variables instead of rendering internal error details and Python object representations.

```python
from jinja2 import Environment, StrictUndefined

# Configure StrictUndefined in production to raise an exception on missing variables
env = Environment(undefined=StrictUndefined)
tmpl = env.from_string('Hello {{ user_name }}')

try:
    rendered = tmpl.render()
except Exception:
    # Handle missing context variables securely
    pass
```

**Rule 2: Combine SandboxedEnvironment with NativeEnvironment for untrusted templates.**

When evaluating native Python types from user-controlled or untrusted templates using Jinja's native rendering features, inherit from both `SandboxedEnvironment` and `NativeEnvironment` to apply attribute access checks and restrict dangerous calls.

```python
from jinja2.sandbox import SandboxedEnvironment
from jinja2.nativetypes import NativeEnvironment

class SandboxedNativeEnvironment(SandboxedEnvironment, NativeEnvironment):
    pass

env = SandboxedNativeEnvironment()
template = env.from_string('{{ x + y }}')
result = template.render(x=4, y=2)
```
