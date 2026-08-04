# Security cards

Repository: `https://github.com/go-gorm/gorm#v1.31.2`
Category: boundary control

## boundary control

### Enforce boundary checks on association field mutability during data persistence

**Use when**

Persisting structs with relationships such as `BelongsTo`, `HasOne`, `HasMany`, or `Many2Many` using untrusted input.

**Secure rules**

**Rule 1: Restrict association field mutability by explicitly specifying select or omit clauses.**

When saving user-provided struct data, developers must enforce strict boundary control by explicitly utilizing `Select` or `Omit` clauses to limit which associated models and nested fields are processed. Avoid executing persistence operations with global full-save behaviors on structs containing untrusted nested fields.

```go
// Safe: Explicitly omit association saves when updating parent model
db.Omit(clause.Associations).Save(&user)

// Safe: Explicitly limit persistence to specific association fields
db.Select("Profile.Bio").Save(&user)
```
