# Security cards

Repository: `https://github.com/go-gorm/gorm#v1.31.2`
Category: security control integrity

## security control integrity

### Prevent Security Control Bypass by Ensuring Lifecycle Hooks Remain Active

**Use when**

Use when performing model updates, deletions, or session configurations where lifecycle hooks enforce critical security validations, audit logging, or field transformations.

**Secure rules**

**Rule 1: Avoid setting SkipHooks to true or using direct update methods that bypass model hooks when hooks contain mandatory security controls.**

Ensure that `SkipHooks` remains false and avoid using `UpdateColumn` or `UpdateColumns` if your model lifecycle hooks handle access control, input validation, or cryptographic hashing. Use `Update` or `Updates` to ensure registered hooks execute properly.

```go
tx := db.Session(&gorm.Session{
    SkipHooks: false,
})
tx.Create(&user)
```
