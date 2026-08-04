# Security cards

Repository: `https://github.com/sqlalchemy/sqlalchemy#rel_2_0_51`
Category: resource exhaustion

## resource exhaustion

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
