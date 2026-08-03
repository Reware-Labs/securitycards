# Security cards

Repository: `https://github.com/pydantic/pydantic#v2.13.4`
Category: security control integrity

## security control integrity

### Enable Assignment Validation and Suppress Bypass Mechanisms in Dataclasses

**Use when**

Defining Pydantic dataclasses or utilizing internal dataclass construction where attribute mutation or validation suppression could bypass security invariants.

**Secure rules**

**Rule 1: Enable assignment validation on Pydantic dataclasses to enforce constraints during post-creation mutations.**

When defining Pydantic dataclasses, attribute assignments post-creation bypass field validation by default. Configure dataclasses with `ConfigDict(validate_assignment=True)` to preserve model security controls and maintain invariant guarantees across the object lifecycle.

```python
from pydantic import ConfigDict
import pydantic.dataclasses

@pydantic.dataclasses.dataclass(config=ConfigDict(validate_assignment=True, str_max_length=20))
class UserProfile:
    username: str

profile = UserProfile(username="alice")
profile.username = "bob"
```

**Rule 2: Keep initialization validation enabled for Pydantic dataclasses**

Use the native `pydantic.dataclasses.dataclass` decorator for dataclass inputs that require Pydantic validation. In Pydantic v2, every Pydantic dataclass is validated during initialization, `validate_on_init` is deprecated, and `validate_on_init=False` is unsupported. Invalid initialization data raises `ValidationError`.

```python
from pydantic import ValidationError
from pydantic.dataclasses import dataclass


@dataclass
class SecurityBoundaryData:
    access_level: int


try:
    SecurityBoundaryData(access_level='not-an-integer')
except ValidationError as exc:
    print(exc)
```
