# Security cards

Repository: `https://github.com/pydantic/pydantic#v2.13.4`
Category: deserialization

## deserialization

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
