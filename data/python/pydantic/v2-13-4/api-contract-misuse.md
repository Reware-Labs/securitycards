# Security cards

Repository: `https://github.com/pydantic/pydantic#v2.13.4`
Category: api contract misuse

## api contract misuse

### Configure Pydantic Aliases and Serialization Options Correctly for API Boundaries

**Use when**

When defining Pydantic models for external APIs and handling field aliases or serialization formats to prevent API contract violations.

**Secure rules**

**Rule 1: Generate JSON schemas using by_alias=True to match external payload keys.**

Always pass by_alias=True when generating JSON schemas for external API clients so that exposed field names match the expected payload keys instead of internal Python attribute names.

```python
from pydantic import BaseModel, ConfigDict, Field

class UserPayload(BaseModel):
    model_config = ConfigDict(alias_generator=lambda name: name.upper())
    user_id: str = Field(alias='userId')

external_schema = UserPayload.model_json_schema(by_alias=True)
```

**Rule 2: Explicitly enable alias serialization for external API responses.**

Set `serialize_by_alias=True` in `ConfigDict` or pass `by_alias=True` to serialization calls like `model_dump` to prevent exposing internal variable names in outgoing responses.

```python
from pydantic import BaseModel, ConfigDict, Field

class UserResponse(BaseModel):
    model_config = ConfigDict(serialize_by_alias=True)
    user_id: int = Field(serialization_alias='userId')

user = UserResponse(user_id=123)
response_data = user.model_dump()
```
