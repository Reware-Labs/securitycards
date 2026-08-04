# Security cards

Repository: `https://github.com/sqlalchemy/sqlalchemy#rel_2_0_51`
Category: input driven boundary selection

## input driven boundary selection

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
