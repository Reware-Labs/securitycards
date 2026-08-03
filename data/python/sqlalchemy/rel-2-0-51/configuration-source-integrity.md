# Security cards

Repository: `https://github.com/sqlalchemy/sqlalchemy#rel_2_0_51`
Category: configuration source integrity

## configuration source integrity

### Explicitly Set max_identifier_length to Maintain Configuration Precedence and Integrity

**Use when**

Configuring database engines with database-specific dialects like Oracle where dynamic introspection can alter critical configuration behavior.

**Secure rules**

**Rule 1: Pin Oracle identifier length when preserving legacy generated names**

Applications that used SQLAlchemy before 1.4 with Oracle Database 12.2 or later should set `max_identifier_length=30` when they must preserve constraint and index names previously generated under the 30-character limit. Without an override, SQLAlchemy determines the supported length when first connecting. Because changing this value can change generated names and break migrations that reference existing names, fully review and test such migrations in a staging environment before changing it.

```python
from sqlalchemy import create_engine

engine = create_engine(
    "oracle+oracledb://scott:tiger@localhost:1521?service_name=freepdb1",
    max_identifier_length=30,
)
```
