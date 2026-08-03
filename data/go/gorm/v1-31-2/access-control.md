# Security cards

Repository: `https://github.com/go-gorm/gorm#v1.31.2`
Category: access control

## access control

### Enforce explicit query filters and field permissions to prevent unauthorized access

**Use when**

Use when querying, updating, or deleting records to ensure that unauthorized actors cannot bypass soft-delete boundaries, expose sensitive fields, or execute unconstrained destructive queries.

**Secure rules**

**Rule 1: Avoid using Unscoped in standard user-facing workflows**

Do not call `Unscoped()` in standard request handlers as it bypasses soft-delete constraints and can expose deleted or revoked resources. Use `Unscoped()` strictly in administrative workflows that require access to archived data.

```go
var user User
if err := db.Where("id = ?", userID).First(&user).Error; err != nil {
    // Handle error or record not found
}
```

**Rule 2: Configure field permission struct tags to restrict model access**

Define field-level permissions using GORM struct tags such as `gorm:"->"`, `gorm:"<-:create"`, and `gorm:"-"` to explicitly enforce read and write permissions on models and prevent unauthorized field updates or exposures.

```go
type UserProfile struct {
    ID        uint   `gorm:"primaryKey"`              // Read and write enabled by default
    Internal  string `gorm:"-"`                        // Completely ignored by GORM
    ReadOnly  string `gorm:"->"`                       // Read-only; creates and updates are ignored
    CreatedAt string `gorm:"<-:create"`                // Writeable on create only; updates ignored
    UpdateOnly string `gorm:"<-:update"`               // Writeable on update only; creates ignored
    WriteOnly string `gorm:"->:false;<-:create,update"` // Write-only; reads are ignored
}
```

**Rule 3: Require explicit WHERE conditions on delete queries**

Supply explicit WHERE clauses or primary key values when performing delete operations to prevent accidental mass data deletion across database tables or unauthorized record destruction.

```go
db.Where("id = ? AND tenant_id = ?", targetID, tenantID).Delete(&User{})
```
