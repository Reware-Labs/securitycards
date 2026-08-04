# Security cards

Repository: `https://github.com/sqlalchemy/sqlalchemy#rel_2_0_51`
Category: deserialization

## deserialization

### Avoid Python Pickle Deserialization for Untrusted Data

**Use when**

Deserializing data streams, query states, ORM objects, or result rows from untrusted sources or network endpoints where arbitrary code execution must be prevented.

**Secure rules**

**Rule 1: Do not use `PickleType` or `sqlalchemy.ext.serializer.loads` with untrusted data inputs.**

Python's native pickle module allows arbitrary code execution during deserialization. Always use safe data formats like `JSON` or structured dictionaries when handling data that can be influenced by external users.

```python
from sqlalchemy import JSON, Column, Integer, Table, MetaData

metadata = MetaData()
user_settings = Table(
    'user_settings',
    metadata,
    Column('id', Integer, primary_key=True),
    Column('preferences', JSON)
)
```
