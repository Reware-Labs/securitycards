# Security cards

Repository: `https://github.com/sqlalchemy/sqlalchemy#rel_2_0_51`
Category: api contract misuse

## api contract misuse

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
