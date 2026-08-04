# Security cards

Repository: `https://github.com/go-gorm/gorm#v1.31.2`
Category: input contract definition

## input contract definition

### Restrict Mass Assignment and Associations During Record Creation

**Use when**

When creating database records from user-controlled input structs or maps to enforce input structure and field boundaries.

**Secure rules**

**Rule 1: Explicitly whitelist allowed fields or exclude sensitive associations using `DB.Select` or `DB.Omit` during record creation.**

Use `DB.Select` to specify allowed input fields for insertion, or use `DB.Omit` with `clause.Associations` to prevent the persistence of unintended nested relationships and mass assignment vulnerabilities.

```go
user := User{Name: "Alice", Account: untrustedAccount}

// Prevent creating or cascading into associated models
if err := db.Omit(clause.Associations).Create(&user).Error; err != nil {
    // handle error
}

// Alternatively, whitelist specific fields for insertion
if err := db.Select("Name", "Age").Create(&user).Error; err != nil {
    // handle error
}
```
