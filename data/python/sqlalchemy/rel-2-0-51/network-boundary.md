# Security cards

Repository: `https://github.com/sqlalchemy/sqlalchemy#rel_2_0_51`
Category: network boundary

## network boundary

### Safely Construct Database Connection URLs to Prevent Host Redirection

**Use when**

Constructing SQLAlchemy database connection URLs when database endpoints must remain within fixed network boundaries.

**Secure rules**

**Rule 1: For psycopg2, do not combine an authority host with a `host` query parameter**

For `postgresql+psycopg2` URLs, specify a single intended connection host. If a URL contains both an authority host and a `host` query parameter, SQLAlchemy silently discards the authority host and connects using the query value. For a single-host connection, set `host` with `URL.create()` and omit `host` from its query mapping.

```python
from sqlalchemy import URL, create_engine

db_url = URL.create(
    drivername="postgresql+psycopg2",
    username="user",
    password="password",
    host="myhost1",
    database="dbname",
)

engine = create_engine(db_url)
```
