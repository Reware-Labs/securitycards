# Security cards

Repository: `https://github.com/pydantic/pydantic#v2.13.4`

## Category: api contract misuse

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


## Category: boundary control

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


## Category: deserialization

### Use Safe YAML Parsers Before Pydantic Validation

**Use when**

When validating YAML data files with Pydantic models to prevent arbitrary object instantiation and code execution before schema validation.

**Secure rules**

**Rule 1: Load YAML data before validating it with a Pydantic model**

When validating data from a YAML file, parse the document with `yaml.safe_load()`, then pass the resulting Python data to `BaseModel.model_validate()` for validation against the model.

```python
import yaml
from pydantic import BaseModel, EmailStr, PositiveInt

class Person(BaseModel):
    name: str
    age: PositiveInt
    email: EmailStr

with open('person.yaml') as f:
    data = yaml.safe_load(f)

person = Person.model_validate(data)
```


## Category: escape hatch

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


## Category: input contract definition

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


## Category: input interpretation safety

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


## Category: resource exhaustion

### Enforce Maximum Length and Size Constraints on Untrusted Inputs

**Use when**

When defining Pydantic models or `pydantic_core` schemas for collections, strings, bytes, and URLs supplied by external or untrusted users.

**Secure rules**

**Rule 1: Constrain input sizes for byte fields, iterables, and collections using length configuration options.**

Use `max_length` in `Field(max_length=...)`, `conbytes(max_length=...)`, `conlist(..., max_length=...)`, `StringConstraints`, or core schema definitions to restrict input size and prevent excessive memory allocation or CPU utilization.

```python
from pydantic import BaseModel, Field, conbytes

class UserUpload(BaseModel):
    raw_bytes: conbytes(max_length=1048576)  # 1 MB maximum
    items: list[str] = Field(max_length=50)
```

**Rule 2: Enforce maximum URL length boundaries using validation constraints.**

Leverage Pydantic's built-in `HttpUrl` or `UrlConstraints(max_length=...)` to automatically reject oversized URLs exceeding expected character limits, safeguarding downstream parsers.

```python
from typing import Annotated
from pydantic import BaseModel, AnyUrl, UrlConstraints

class BoundedUrlModel(BaseModel):
    web_link: Annotated[AnyUrl, UrlConstraints(max_length=2083, allowed_schemes=['http', 'https'])]
```

**Rule 3: Limit collection sizes on dictionary and set schemas.**

Always configure `max_length` when defining set, frozenset, list, dictionary, or generator schemas for untrusted or external iterator inputs to prevent denial of service through resource exhaustion.

```python
from pydantic_core import SchemaValidator, core_schema as cs

schema = cs.dict_schema(
    keys_schema=cs.str_schema(),
    values_schema=cs.int_schema(),
    max_length=100
)
validator = SchemaValidator(schema)
data = validator.validate_python({'key1': 1, 'key2': 2})
```

**Rule 4: Enable fail-fast validation on complex or large collection schemas.**

Configure `fail_fast=True` on collection or dictionary schemas to halt validation immediately upon encountering the first invalid item or key, preventing CPU and memory consumption from accumulating error records.

```python
from pydantic_core import SchemaValidator, core_schema as cs

schema = cs.dict_schema(
    keys_schema=cs.int_schema(),
    values_schema=cs.int_schema(),
    fail_fast=True
)
validator = SchemaValidator(schema)
```


## Category: secret handling

### Protect sensitive fields and credentials using Pydantic secret types and model configuration

**Use when**

Defining Pydantic models that process or store sensitive data like API keys, passwords, tokens, or personal information.

**Secure rules**

**Rule 1: Use SecretStr or SecretBytes for sensitive fields to prevent accidental exposure**

Wrap sensitive parameters using `SecretStr` or `SecretBytes` so Pydantic automatically masks these values in string representations, repr outputs, and model dumps, requiring explicit calls to `.get_secret_value()` to expose the unmasked payload.

```python
from pydantic import BaseModel, SecretStr

class SecurityConfig(BaseModel):
    api_key: SecretStr

config = SecurityConfig(api_key='super-secret-token')
print(config)
raw_key = config.api_key.get_secret_value()
```

**Rule 2: Configure hide input in errors to prevent credential leakage in validation exceptions**

Set `hide_input_in_errors=True` in model configuration to ensure raw input data is not embedded directly into `ValidationError` messages when validation fails on sensitive fields.

```python
from pydantic import BaseModel, ConfigDict

class LoginRequest(BaseModel):
    model_config = ConfigDict(hide_input_in_errors=True)
    username: str
    password: str
```


## Category: security control integrity

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
