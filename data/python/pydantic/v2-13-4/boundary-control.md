# Security cards

Repository: `https://github.com/pydantic/pydantic#v2.13.4`
Category: boundary control

## boundary control

### Enforce Strict Payload Schema Validation and Boundary Checks

**Use when**

Parsing untrusted external input payloads or configuration data at application boundaries.

**Secure rules**

**Rule 1: Configure model_config with extra='forbid' when parsing input from untrusted sources.**

Set `model_config = ConfigDict(extra='forbid')` inside models receiving untrusted payloads to ensure unexpected fields are rejected with a `ValidationError` rather than accepted.

```python
from pydantic import BaseModel, ConfigDict

class SecureUserPayload(BaseModel):
    model_config = ConfigDict(extra='forbid')
    username: str
    email: str
```

**Rule 2: Enforce strict input range boundaries and temporal constraints using metadata.**

Define explicit upper and lower boundary constraints or temporal constraints using `Field` or `Annotated` types to ensure that accepted values strictly fall within expected business limits.

```python
from datetime import date
from pydantic import BaseModel, Field

class EventFilter(BaseModel):
    start_date: date = Field(ge=date(2000, 1, 1), le=date(2100, 12, 31))
```
