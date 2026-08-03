# Security cards

Repository: `https://github.com/sqlalchemy/sqlalchemy#rel_2_0_51`
Category: session management

## session management

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
