# Security cards

Repository: `https://github.com/sqlalchemy/sqlalchemy#rel_2_0_51`
Category: secret handling

## secret handling

### Load Database Credentials and Passphrases from Secure Sources

**Use when**

Configuring database connection strings, engine URLs, and cryptographic parameters requiring sensitive credentials or passphrases.

**Secure rules**

**Rule 1: Supply SQLCipher passphrases through `URL.create()` instead of interpolating them into URL strings**

Retrieve the passphrase from an environment variable or secret manager, pass it unchanged as the `password` argument to `URL.create()`, and give the resulting `URL` object directly to `create_engine()`. This bypasses string-URL parsing, so special characters in the passphrase do not require URL encoding.

```python
import os

from sqlalchemy import URL, create_engine

db_url = URL.create(
    drivername="sqlite+pysqlcipher",
    password=os.environ["DB_PASSPHRASE"],
    database="encrypted.db",
)

engine = create_engine(db_url)
```
