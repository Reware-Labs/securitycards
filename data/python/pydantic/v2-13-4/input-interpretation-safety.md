# Security cards

Repository: `https://github.com/pydantic/pydantic#v2.13.4`
Category: input interpretation safety

## input interpretation safety

### Enforce Strict Validation Modes to Prevent Implicit Type Coercion

**Use when**

When validating external or untrusted input payloads where automatic type coercion could alter expected data structures or bypass input verification.

**Secure rules**

**Rule 1: Use strict mode to reduce unwanted input coercion**

Enable strict mode when an input boundary should reject conversions normally allowed by Pydantic's lax mode. Strict mode is less lenient, but it does not prohibit every conversion: accepted inputs depend on the field type and whether validation receives Python or JSON data. For example, strict `float` fields accept integers, and some types accept string representations from JSON. Apply strictness at the model, field, type, or validation-call level and consult the documented conversion rules for each input type.

```python
from pydantic import BaseModel, ConfigDict, ValidationError


class StrictInputModel(BaseModel):
    model_config = ConfigDict(strict=True)

    user_id: int
    score: float


validated = StrictInputModel.model_validate({
    'user_id': 123,
    'score': 10,
})
assert validated.score == 10.0

try:
    StrictInputModel.model_validate({
        'user_id': '123',
        'score': 10,
    })
except ValidationError as exc:
    print(exc)
```

**Rule 2: Account for the input source when strictly validating temporal values**

Do not assume that strict mode rejects every string or numeric representation of a temporal value. Strict behavior depends on both the target type and the validation path. For example, strict Python validation of a `date` requires a `date` instance and rejects a date string, while strict JSON validation accepts a correctly formatted date string. Use the validation method that matches the actual input source and consult the documented strict conversion rules for each temporal or numeric type.

```python
from datetime import date

from pydantic import TypeAdapter, ValidationError

date_adapter = TypeAdapter(date)

try:
    date_adapter.validate_python('2000-01-01', strict=True)
except ValidationError as exc:
    print(exc)

validated_date = date_adapter.validate_json(
    '"2000-01-01"',
    strict=True,
)
assert validated_date == date(2000, 1, 1)
```


### Validate and Restrict Network and URI Inputs at Boundaries

**Use when**

When handling URLs, network endpoints, or module paths derived from untrusted user input.

**Secure rules**

**Rule 1: Use specialized URL and DSN types to enforce scheme boundaries and prevent protocol confusion.**

Use specialized network types such as `HttpUrl`, `WebsocketUrl`, or specific DSN types instead of generic strings to restrict acceptable schemes strictly to expected protocols and validate host and port structures.

```python
from pydantic import BaseModel, HttpUrl

class WebhookModel(BaseModel):
    target_url: HttpUrl

data = WebhookModel(target_url="https://example.com/webhook")
print(data.target_url.host)
```

**Rule 2: Restrict ImportString field inputs to an explicit allowlist of trusted targets.**

Enforce strict allowlists or trusted string checks before validating `ImportString` fields to prevent dynamic string import resolution from loading arbitrary Python modules.

```python
from typing import Any, Callable
from pydantic import BaseModel, ImportString, field_validator

ALLOWED_FUNCTIONS = {'math:cos', 'math:sin'}

class SafeTaskModel(BaseModel):
    handler: ImportString[Callable[[Any], Any]]

    @field_validator('handler', mode='before')
    @classmethod
    def validate_allowed_import(cls, v: Any) -> Any:
        if v not in ALLOWED_FUNCTIONS:
            raise ValueError('Unauthorized import path')
        return v
```
