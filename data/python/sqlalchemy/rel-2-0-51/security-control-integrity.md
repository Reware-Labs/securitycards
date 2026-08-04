# Security cards

Repository: `https://github.com/sqlalchemy/sqlalchemy#rel_2_0_51`
Category: security control integrity

## security control integrity

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
