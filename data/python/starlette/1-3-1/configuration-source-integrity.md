# Security cards

Repository: `https://github.com/Kludex/starlette#1.3.1`
Category: configuration source integrity

## configuration source integrity

### Enforce Configuration Mutability Control Using Starlette Environ

**Use when**

Accessing and managing environment variables programmatically during application setup or initialization to prevent runtime mutation and configuration inconsistency.

**Secure rules**

**Rule 1: Use Starlette's `Environ` mapping or `starlette.config.environ` to track and prevent unauthorized environment variable modifications after application configuration has been evaluated.**

Use `starlette.config.environ` or instantiate `Environ` to read environment settings safely. Starlette tracks accessed variables and enforces configuration mutability control by raising an error if a variable is mutated or deleted after evaluation, preventing unexpected state changes and runtime tampering.

```python
from starlette.config import Environ, EnvironError

environ = Environ()
is_testing = environ.get("TESTING", "False")

try:
    environ["TESTING"] = "True"
except EnvironError:
    pass
```
