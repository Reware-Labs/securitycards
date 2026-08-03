# Security cards

Repository: `https://github.com/sqlalchemy/sqlalchemy#rel_2_0_51`

## Category: access control

### Apply tenant isolation and row-level access criteria using top-level loader options

**Use when**

Enforcing tenant isolation or row-level access control on database queries using SQLAlchemy ORM relationship loader options.

**Secure rules**

**Rule 1: Enforce tenant isolation and row-level access control at the top-level query or via event handlers rather than nesting filters inside relationship loader chains.**

When enforcing tenant isolation or row-level access control, pass the `with_loader_criteria()` option at the top-level query level or inside a `do_orm_execute` event handler. Do not nest `with_loader_criteria()` inside relationship load option chains like `selectinload().options()`, as SQLAlchemy will reject this with an `ArgumentError`.

```python
from sqlalchemy import event, select
from sqlalchemy.orm import Session, with_loader_criteria

stmt = select(User).options(
    with_loader_criteria(Address, Address.tenant_id == current_tenant_id)
)

@event.listens_for(Session, "do_orm_execute")
def add_tenant_filter(orm_context):
    if orm_context.is_select:
        orm_context.statement = orm_context.statement.options(
            with_loader_criteria(Address, Address.tenant_id == get_current_tenant_id())
        )
```


## Category: api contract misuse

### Invoke Unique and Handle Result Options Correctly on SQLAlchemy Queries

**Use when**

When executing queries with joined collection relationships or server-side cursors where specific result processing methods and execution options are mandated by the API contract.

**Secure rules**

**Rule 1: Explicitly call `.unique()` on query results when using `joinedload()` against collection relationships.**

When processing queries that include joined collection eager loads, always call `.unique()` on the ORM `Result` object before consuming scalar objects. Failing to invoke `.unique()` raises an `InvalidRequestError` because joined collection queries duplicate parent rows in the database result set.

```python
from sqlalchemy import select
from sqlalchemy.orm import joinedload

stmt = select(User).options(joinedload(User.addresses))
result = session.scalars(stmt).unique()
users = result.all()
```

**Rule 2: Use `AsyncSession.stream()` or `AsyncSession.stream_scalars()` for server-side cursors.**

Do not invoke `AsyncSession.execute()` when handling queries configured with server-side cursors or the `stream_results=True` execution option. Server-side streaming results require `AsyncSession.stream()` or `AsyncSession.stream_scalars()`; invoking `execute()` instead raises an `AsyncMethodRequired` exception.

```python
stmt = select(User).execution_options(stream_results=True)
result = await async_session.stream(stmt)
async for partition in result.scalars().partitions():
    for user in partition:
        process_user(user)
```


### Verify Parameters and Event Context in SQLAlchemy Interceptors and Load Listeners

**Use when**

When implementing execution event interceptors, mapper load listeners, or concurrency controls where correct argument types, execution order, and option provisions are required.

**Secure rules**

**Rule 1: Preserve executemany cardinality when overriding re-execution parameters**

When passing an override list to `ORMExecuteState.invoke_statement()` during an executemany operation, supply exactly one override dictionary for each original parameter dictionary. SQLAlchemy merges each override with its corresponding original parameter set and raises `InvalidRequestError` if the two lists have different lengths.

```python
from sqlalchemy import event


@event.listens_for(session, "do_orm_execute")
def normalize_batch_names(orm_execute_state):
    if orm_execute_state.is_executemany:
        overrides = [
            {"name": parameters["name"].strip()}
            for parameters in orm_execute_state.parameters
        ]
        return orm_execute_state.invoke_statement(params=overrides)
```

**Rule 2: Set `restore_load_context=True` when triggering queries inside load event listeners.**

When registering instance load or refresh event listeners via `InstanceEvents`, set `restore_load_context=True` if the listener callback performs operations that trigger database access. Omitting this option changes the active loader context and interferes with eager loading routines.

```python
from sqlalchemy import event
from myapp.models import User

@event.listens_for(User, 'load', restore_load_context=True)
def receive_load(target, context):
    if target.deferred_security_flags is None:
        target.initialize_default_flags()
```


## Category: authentication

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


## Category: boundary control

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


## Category: configuration source integrity

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


## Category: cryptography

### Configure Robust Key Derivation and Encryption Parameters for Databases

**Use when**

Configuring database connection URLs with extensions like SQLCipher where encryption settings and key derivation iteration counts must be explicitly specified.

**Secure rules**

**Rule 1: Pass explicit encryption parameters and iteration counts in connection URLs to enforce strong cryptographic protection.**

When initializing database connections that support encryption, supply necessary parameters such as `kdf_iter`, `cipher`, `cipher_page_size`, and `cipher_use_hmac` through the connection URL to protect database files against offline brute-force attacks and avoid reliance on weak defaults.

```python
from sqlalchemy import create_engine

engine = create_engine(
    "sqlite+pysqlcipher://:passphrase@/encrypted.db?kdf_iter=256000&cipher_use_hmac=1"
)
```


## Category: deserialization

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


## Category: escape hatch

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


## Category: injection

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


## Category: input contract definition

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


## Category: input driven boundary selection

### Explicitly scope database queries using set_shard_id to bind resource domains

**Use when**

When using `ShardedSession` to execute persistence and query operations across multiple database instances.

**Secure rules**

**Rule 1: Constrain untrusted shard selection by attaching explicit shard boundaries using set_shard_id.**

Always attach `set_shard_id` to statements using `.options()` to lock execution and lazy-loader propagation to a single target shard backend, preventing execution across all registered shards and data leakage between isolated resource domains.

```python
from sqlalchemy import select
from sqlalchemy.ext.horizontal_shard import set_shard_id

stmt = (
    select(User)
    .where(User.id == user_id)
    .options(set_shard_id("shard_east", propagate_to_loaders=True))
)
results = session.execute(stmt).scalars().all()
```


## Category: input interpretation safety

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


## Category: network boundary

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


## Category: resource exhaustion

### Stream large query result sets and optimize collection loading to prevent memory exhaustion

**Use when**

Streaming or querying large datasets in SQLAlchemy to prevent memory exhaustion and database connection degradation.

**Secure rules**

**Rule 1: Use yield_per to stream large query result sets in controlled batches**

When executing queries that return large datasets, avoid loading all rows into memory simultaneously via bulk methods like `.all()` or by using `.unique()` without memory limits. Stream or batch large result sets using `yield_per()` to bound memory utilization.

```python
stmt = select(User).execution_options(yield_per=1000)
result = session.scalars(stmt)
for user in result:
    process_user(user)
```

**Rule 2: Configure raiseload on relationship attributes to prevent N+1 query cascades**

Configure `raiseload` on relationship attributes or pass `raiseload=True` to `load_only()` when retrieving entities meant for serialization or cross-boundary processing. This prevents implicit lazy-loading database queries from executing when un-eagerly loaded attributes are accessed.

```python
from sqlalchemy import select
from sqlalchemy.orm import raiseload, load_only

stmt = select(User).options(raiseload(User.addresses))
stmt_columns = select(User).options(load_only(User.id, User.username, raiseload=True))
```

**Rule 3: Use selectinload alongside yield_per for streaming related collections**

Do not pair ORM `yield_per` execution options with collection eager loaders like `joinedload()` or `subqueryload()`. Use `selectinload()` alongside `yield_per` for memory-safe batch processing of related entities without raising an `InvalidRequestError`.

```python
from sqlalchemy import select
from sqlalchemy.orm import selectinload

stmt = (
    select(User)
    .options(selectinload(User.addresses))
    .execution_options(yield_per=100)
)

for user in session.scalars(stmt):
    process_user(user)
```


## Category: secret handling

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


## Category: security control integrity

### Track Conditional Closure Variables in Cached Lambda Statements

**Use when**

When building cached SQL statements using `lambda_stmt` or adding criteria that involve conditional branching or tenant isolation filters.

**Secure rules**

**Rule 1: Keep SQL-shape conditionals outside cached lambda bodies**

When a condition determines which SQL fragment a `lambda_stmt()` will produce, evaluate that condition with ordinary Python control flow and attach a separate lambda for each branch. A cached lambda should produce the same SQL structure consistently; SQLAlchemy warns that in-lambda conditionals can cause failures, including some it cannot reliably detect.

```python
from sqlalchemy import column, lambda_stmt, select, table

records = table("records", column("id"), column("value"))


def build_query(parameter, use_greater_than=False):
    stmt = lambda_stmt(lambda: select(records))

    if use_greater_than:
        stmt += lambda s: s.where(records.c.value > parameter)
    else:
        stmt += lambda s: s.where(records.c.value == parameter)

    return stmt
```


## Category: session management

### Remove and Clean Up Scoped Sessions to Prevent State Leakage

**Use when**

When managing database sessions and connection scopes across multi-threaded or asynchronous application requests and task handlers.

**Secure rules**

**Rule 1: Explicitly remove scoped sessions after each request or task boundary.**

Invoke `scoped_session.remove()` or `await scoped_session.remove()` at the end of each request or task context, such as within framework teardown handlers or middleware. This ensures session instances, uncommitted transactional state, dirty ORM entities, and identity map cached data are cleared before threads or task workers are reused across distinct requests.

```python
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, async_scoped_session

engine = create_async_engine("postgresql+asyncpg://user:password@localhost/dbname")
session_factory = async_sessionmaker(engine)
ScopedSession = async_scoped_session(session_factory, scopefunc=asyncio.current_task)

async def handle_request():
    session = ScopedSession()
    try:
        pass
    finally:
        await ScopedSession.remove()
```
