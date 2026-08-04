# Security cards

Repository: `https://github.com/sqlalchemy/sqlalchemy#rel_2_0_51`
Category: input contract definition

## input contract definition

### Enforce Input Coercion and Type Validation in Custom Mutable ORM Types

**Use when**

Implementing custom mutable scalar or composite types with `Mutable` or `MutableComposite` in SQLAlchemy ORM models where incoming assignments require structural type validation and rejection of unexpected data types.

**Secure rules**

**Rule 1: Override coerce() when a custom Mutable type accepts alternate input types**

Defining `coerce()` is optional. Override it when assignments or ORM-loaded values may use another representation, such as plain dictionaries that must become mutable dictionary instances. Return the converted value for supported representations and delegate unsupported values to `Mutable.coerce()`, which raises `ValueError`. Independently, every in-place mutation method must call `changed()` so the ORM detects modifications.

```python
from sqlalchemy.ext.mutable import Mutable


class MutableDict(Mutable, dict):
    @classmethod
    def coerce(cls, key, value):
        if not isinstance(value, MutableDict):
            if isinstance(value, dict):
                return MutableDict(value)
            return Mutable.coerce(key, value)
        return value

    def __setitem__(self, key, value):
        dict.__setitem__(self, key, value)
        self.changed()

    def __delitem__(self, key):
        dict.__delitem__(self, key)
        self.changed()
```
