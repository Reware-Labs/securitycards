# Security cards

Repository: `https://github.com/pydantic/pydantic#v2.13.4`
Category: escape hatch

## escape hatch

### Avoid Validation Bypass APIs When Processing Untrusted Data

**Use when**

Processing untrusted input data or working with low-level Pydantic methods that bypass normal runtime schema validation, type checking, and field constraints.

**Secure rules**

**Rule 1: Do not instantiate models using `model_construct()` with untrusted input.**

Use standard model validation methods like `model_validate()` instead of `model_construct()` when handling external data to ensure all field constraints and types are properly enforced.

```python
from pydantic import BaseModel

class UserPayload(BaseModel):
    user_id: int
    username: str

untrusted_input = {'user_id': '123', 'username': 'alice'}
user = UserPayload.model_validate(untrusted_input)
```

**Rule 2: Avoid accessing `.raw_function` on validated call decorators with untrusted arguments.**

Always invoke the decorated function directly to maintain argument validation and type coercion instead of bypassing protections via `.raw_function`.

**Rule 3: Validate untrusted update data before using `model_copy()`**

`model_copy(update=...)` does not validate the update mapping, and its API documentation requires that update data be trusted. When an update comes from an untrusted source, validate it with a dedicated Pydantic model before passing the validated model's dumped values to `model_copy()`.

```python
from pydantic import BaseModel


class Settings(BaseModel):
    theme: str
    max_items: int


class MaxItemsUpdate(BaseModel):
    max_items: int


current_settings = Settings(theme='dark', max_items=10)
untrusted_patch = {'max_items': '100'}

validated_update = MaxItemsUpdate.model_validate(untrusted_patch)
updated_settings = current_settings.model_copy(
    update=validated_update.model_dump()
)

assert updated_settings.max_items == 100
```
