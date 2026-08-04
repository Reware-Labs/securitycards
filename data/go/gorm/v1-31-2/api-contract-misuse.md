# Security cards

Repository: `https://github.com/go-gorm/gorm#v1.31.2`
Category: api contract misuse

## api contract misuse

### Check RowsAffected and ErrRecordNotFound after scanning query results

**Use when**

When executing row scans with GORM's `Scan` API and utilizing the returned results in authorization, authentication, or business logic.

**Secure rules**

**Rule 1: Verify both database errors and row counts after executing a scan query.**

Always check `db.Error` using `errors.Is(err, gorm.ErrRecordNotFound)` and verify that `db.RowsAffected > 0` before trusting destination structs or maps in your application logic. When zero rows match the query, `db.RowsAffected` remains 0 and GORM will not add `gorm.ErrRecordNotFound` to `db.Error` unless explicitly configured, risking the use of uninitialized or zero-valued structures.

```go
var user User
result := db.Table("users").Where("id = ? AND active = ?", userID, true).Scan(&user)
if result.Error != nil {
    if errors.Is(result.Error, gorm.ErrRecordNotFound) {
        return nil, errors.New("user not found")
    }
    return nil, result.Error
}
if result.RowsAffected == 0 {
    return nil, errors.New("user not found")
}
```
