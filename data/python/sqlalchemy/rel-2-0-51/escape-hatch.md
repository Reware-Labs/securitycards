# Security cards

Repository: `https://github.com/sqlalchemy/sqlalchemy#rel_2_0_51`
Category: escape hatch

## escape hatch

### Use Parameterized Queries With Raw SQL Escape Hatches

**Use when**

Rendering raw SQL fragments using low-level escape hatch mechanisms like text() or literal_column() within SQLAlchemy Core or ORM queries.

**Secure rules**

**Rule 1: Avoid concatenating or formatting untrusted user input directly into raw SQL escape hatch functions.**

Functions like `text()` and `literal_column()` bypass SQLAlchemy compiler identifier quoting and automatic parameter binding, directly embedding user input into the SQL string sent to the database driver. When raw SQL fragments are required, use named bind parameter placeholders within `text()` constructs and supply values via parameter dictionaries or `bindparams()`.

```python
from sqlalchemy import text

# SAFE: Parameterized raw SQL text construct
stmt = text("SELECT * FROM users WHERE status = :status").bindparams(status=untrusted_status)
result = connection.execute(stmt)
```
