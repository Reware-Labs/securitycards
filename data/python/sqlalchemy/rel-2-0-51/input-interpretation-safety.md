# Security cards

Repository: `https://github.com/sqlalchemy/sqlalchemy#rel_2_0_51`
Category: input interpretation safety

## input interpretation safety

### Use URL create for safe connection string construction

**Use when**

When constructing database connection URLs dynamically using credentials or components containing special characters to prevent parsing and component boundary misinterpretation.

**Secure rules**

**Rule 1: Use `URL.create()` when constructing database URLs from unescaped components**

When building a database URL from individual components, create a `URL` object with `URL.create()` and pass it directly to `create_engine()`. Pass password characters unchanged because the `URL` object bypasses URL-string parsing. If you instead supply a complete URL string, percent-encode special characters in its username and password.

```python
from sqlalchemy import URL, create_engine

url_object = URL.create(
    "postgresql+pg8000",
    username="dbuser",
    password="kx@jj5/g",
    host="pghost10",
    database="appdb",
)

engine = create_engine(url_object)
```
