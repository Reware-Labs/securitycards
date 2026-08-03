# Security cards

Repository: `https://github.com/sqlalchemy/sqlalchemy#rel_2_0_51`
Category: authentication

## authentication

### Configure Azure AD Token Authentication in SQLAlchemy Connections

**Use when**

Connecting to Microsoft SQL Server or Azure SQL Database using dynamic Azure Active Directory access tokens via SQLAlchemy event listeners.

**Secure rules**

**Rule 1: Strip conflicting default connection parameters when supplying Azure AD access tokens.**

When establishing database connections with dynamic Azure Active Directory tokens, SQLAlchemy may automatically append `Trusted_Connection=Yes` if no username or password is present in the URL. You must register a `do_connect` event listener to strip the `Trusted_Connection=Yes` parameter and attach the proper Azure AD token structure to `cparams['attrs_before']` to prevent authentication failures or unexpected credential fallbacks.

```python
import struct
from azure import identity
from sqlalchemy import create_engine, event

engine = create_engine(
    "mssql+pyodbc://@my-server.database.windows.net/myDb?driver=ODBC+Driver+17+for+SQL+Server"
)
azure_credentials = identity.DefaultAzureCredential()
SQL_COPT_SS_ACCESS_TOKEN = 1256
TOKEN_URL = "https://database.windows.net/"


@event.listens_for(engine, "do_connect")
def provide_token(dialect, conn_rec, cargs, cparams):
    cargs[0] = cargs[0].replace(";Trusted_Connection=Yes", "")
    raw_token = azure_credentials.get_token(TOKEN_URL).token.encode("utf-16-le")
    token_struct = struct.pack(
        f"<I{len(raw_token)}s", len(raw_token), raw_token
    )
    cparams["attrs_before"] = {SQL_COPT_SS_ACCESS_TOKEN: token_struct}
```
