# Security cards

Repository: `https://github.com/sqlalchemy/sqlalchemy#rel_2_0_51`
Category: boundary control

## boundary control

### Sanitize PostgreSQL Search Path During Metadata Reflection and Table Definition

**Use when**

Reflecting database metadata or defining table schemas against PostgreSQL databases where search_path configurations or schema names may lead to schema shadowing and unintended data access boundaries.

**Secure rules**

**Rule 1: Explicitly specify target schemas and ignore insecure search paths during metadata reflection.**

Avoid relying on implicit PostgreSQL `search_path` resolution or matching database usernames to remote schemas when reflecting database metadata. Keep `search_path` configured to public, explicitly specify target schemas on `Table` definitions, or set `postgresql_ignore_search_path=True` during metadata reflection to prevent foreign keys and reflected tables from binding to unintended schemas.

```python
Table('users', metadata, Column('id', Integer, primary_key=True), schema='app_schema')

MetaData().reflect(bind=engine, postgresql_ignore_search_path=True)
```
