# Security cards

Repository: `https://github.com/pydantic/pydantic#v2.13.4`
Category: resource exhaustion

## resource exhaustion

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
