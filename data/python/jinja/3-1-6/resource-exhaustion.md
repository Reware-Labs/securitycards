# Security cards

Repository: `https://github.com/pallets/jinja#3.1.6`
Category: resource exhaustion

## resource exhaustion

### Enforce Range Limits and Intercept Expensive Operations in Sandboxed Environments

**Use when**

Rendering untrusted templates where attackers might trigger excessive CPU or memory consumption using large ranges or expensive operators.

**Secure rules**

**Rule 1: Use SandboxedEnvironment to automatically restrict range allocations and prevent resource exhaustion.**

Always render untrusted template strings using `SandboxedEnvironment` or `ImmutableSandboxedEnvironment` so that Python's built-in range function is safely replaced with `safe_range` which raises an `OverflowError` for ranges exceeding `MAX_RANGE` items.

```python
from jinja2.sandbox import SandboxedEnvironment

env = SandboxedEnvironment()
template = env.from_string('{% for i in range(1000000) %}{{ i }}{% endfor %}')
```
