# Security cards

Repository: `https://github.com/sqlalchemy/sqlalchemy#rel_2_0_51`
Category: injection

## injection

### Parameterize Queries and Use Expression Constructs Instead of Raw String Concatenation

**Use when**

When executing queries, building DML statements, or filtering database entities using SQLAlchemy Core, ORM, or textual SQL.

**Secure rules**

**Rule 1: Always use bound parameters or expression constructs to separate untrusted user input from query syntax.**

Pass untrusted user input as separate parameters using `params()`, the `values()` method, or explicit parameter dictionaries via `text()` rather than interpolating or concatenating strings into raw SQL queries. This ensures that DBAPI parameter binding isolates user data from executable SQL commands.

```python
from sqlalchemy import text, select
from sqlalchemy.orm import Session

with Session(engine) as session:
    result = session.execute(
        text("SELECT * FROM users WHERE id = :user_id"),
        {"user_id": user_input_id}
    )
```

**Rule 2: Avoid passing untrusted input to literal SQL rendering functions or raw statement modifiers.**

Do not pass unsanitized or user-controlled input directly into `literal_column()`, statement prefix/suffix/hint methods, or custom operator strings. Use `literal()` to treat dynamic scalar values safely as bound parameters, and restrict operator strings or hints to hardcoded values or verified allowlists.

```python
from sqlalchemy.sql import literal, select

user_input = "user_supplied_string"
stmt = select(User).where(User.email == literal(user_input))
```


### Safely Quote Identifiers and Construct DDL Schema Objects

**Use when**

When constructing database schema definitions, DDL statements, custom types, or connection URLs with dynamic or external identifiers.

**Secure rules**

**Rule 1: Explicitly quote dynamic schema identifiers and use SQLAlchemy schema constructs for DDL generation.**

When creating database schema objects like `Table` or `Column` using external strings, ensure identifiers are quoted by setting `quote=True` or wrapping them with `quoted_name(name, quote=True)`. Always use dedicated SQLAlchemy schema and dialect constructs rather than string formatting for DDL definitions.

```python
from sqlalchemy import MetaData, Table, Column, Integer, String
from sqlalchemy.sql.elements import quoted_name

metadata = MetaData()
safe_table_name = quoted_name(user_provided_name, quote=True)
dynamic_table = Table(
    safe_table_name,
    metadata,
    Column("id", Integer, primary_key=True),
    Column("payload", String(100)),
    quote=True
)
```
