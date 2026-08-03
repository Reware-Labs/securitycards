# Security cards

Repository: `https://github.com/sqlalchemy/sqlalchemy#rel_2_0_51`
Category: access control

## access control

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
