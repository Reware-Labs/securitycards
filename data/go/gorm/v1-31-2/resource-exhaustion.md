# Security cards

Repository: `https://github.com/go-gorm/gorm#v1.31.2`
Category: resource exhaustion

## resource exhaustion

### Enforce Query Timeouts and Resource Limits in GORM Sessions

**Use when**

Configuring GORM database instances and executing queries that require bounds on execution time or connection duration.

**Secure rules**

**Rule 1: Configure default execution timeouts and statement cache bounds on GORM configuration.**

Set `DefaultContextTimeout`, `PrepareStmtMaxSize`, and `PrepareStmtTTL` in `gorm.Config` to ensure all queries execute within bounded resource limits and prevent unbounded memory growth.

```go
db, err := gorm.Open(sqlite.Open("test.db"), &gorm.Config{
    PrepareStmt:        true,
    PrepareStmtMaxSize: 1000,
    PrepareStmtTTL:     30 * time.Minute,
    DefaultContextTimeout: 5 * time.Second,
})
```

**Rule 2: Pass explicit context timeouts to query sessions.**

Use `.WithContext(ctx)` with a timeout deadline when executing queries to prevent operations from hanging indefinitely under network outages or lock contention.

```go
ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
defer cancel()

var user User
if err := db.WithContext(ctx).First(&user, id).Error; err != nil {
    // handle error or context timeout
}
```
