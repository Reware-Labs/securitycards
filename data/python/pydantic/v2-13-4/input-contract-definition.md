# Security cards

Repository: `https://github.com/pydantic/pydantic#v2.13.4`
Category: input contract definition

## input contract definition

### Enforce Strict Field Boundaries and Schema Constraints on Input Payloads

**Use when**

Use when designing and validating incoming API requests, external file payloads, or untrusted data models to ensure inputs adhere strictly to defined types, ranges, lengths, and extra field restrictions.

**Secure rules**

**Rule 1: Enable default value validation for model fields.**

Set `validate_default=True` on fields or within model configuration to ensure default values undergo custom validators and type checks.

```python
from typing import Annotated
from pydantic import AfterValidator, BaseModel, Field

def sanitize_identifier(value: str) -> str:
    if not value.isalnum():
        raise ValueError('Identifier must be alphanumeric')
    return value

SafeIdentifier = Annotated[str, AfterValidator(sanitize_identifier)]

class ConfigModel(BaseModel):
    identifier: SafeIdentifier = Field(default='defaultID123', validate_default=True)
```

**Rule 2: Annotate inner container elements directly to enforce security constraints.**

Use `typing.Annotated` with `Field` metadata on inner container elements to ensure collection items are explicitly validated against boundaries.

```python
from typing import Annotated
from pydantic import BaseModel, Field

class SecurePayload(BaseModel):
    tags: list[Annotated[str, Field(pattern=r'^[a-zA-Z0-9_-]+$')]]
```


### Enforce Strict Validation Modes and Type Boundaries on Inputs

**Use when**

Use when defining precise input type contracts, decimal bounds, float constraints, and schema validation modes to reject malformed data before application processing.

**Secure rules**

**Rule 1: Use validation-mode JSON Schema to describe input contracts**

Use `model_json_schema(mode='validation')` when a schema consumer needs the representation corresponding to inputs accepted by the model. Validation mode is already the default, so specifying it explicitly is optional. JSON Schema generation describes the contract; validate runtime input separately with model construction, `model_validate()`, or `model_validate_json()`.

```python
from decimal import Decimal

from pydantic import BaseModel


class PaymentRequest(BaseModel):
    amount: Decimal
    data: bytes


input_schema = PaymentRequest.model_json_schema(mode='validation')

payment = PaymentRequest.model_validate({
    'amount': '12.50',
    'data': b'payment-details',
})
```

**Rule 2: Constrain Type Annotations with Specific Subclass Bounds.**

Parameterize type attributes with specific base classes rather than unconstrained types to enforce subclass validation at runtime.

```python
from pydantic import BaseModel, ConfigDict

class PluginBase:
    pass

class ApprovedPlugin(PluginBase):
    pass

class PluginConfig(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    plugin_cls: type[PluginBase]

config = PluginConfig(plugin_cls=ApprovedPlugin)
```
