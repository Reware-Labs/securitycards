# Security cards

Repository: `https://github.com/beego/beego#v2.3.10`
Category: api contract misuse

## api contract misuse

### Avoid deprecated QueryTableWithCtx and QueryM2MWithCtx context methods

**Use when**

When building database queries and propagating request contexts in Beego ORM.

**Secure rules**

**Rule 1: Call context-aware execution methods directly on the resulting QuerySeter or QueryM2Mer instead of using deprecated context table constructors.**

Do not rely on `QueryTableWithCtx` or `QueryM2MWithCtx` for request context cancellation or timeout propagation because passed context parameters are ignored. Instead, call context-aware execution methods directly on the resulting `QuerySeter` or `QueryM2Mer` such as `AllWithCtx`, `OneWithCtx`, `InsertWithCtx`, or `UpdateWithCtx`.

```go
var users []*User
num, err := ormer.QueryTable("user").AllWithCtx(ctx, &users)
```
