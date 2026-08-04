# Security cards

Repository: `https://github.com/go-gorm/gorm#v1.31.2`
Category: injection

## injection

### Parameterize Dynamic Query Clauses and Expressions in GORM

**Use when**

When building query clauses, raw statements, custom valuers, associations, or joins where dynamic or untrusted input is included in database operations.

**Secure rules**

**Rule 1: Use parameter placeholders for untrusted input in query conditions.**

Always pass untrusted user input using parameterized placeholders such as `?` or named parameters in GORM query methods like `Where` to prevent SQL injection.

```go
var user User
userInput := "jinzhu; delete * from users"
if err := db.Where("name = ?", userInput).First(&user).Error; err != nil {
    // handle error
}
```

**Rule 2: Use parameter placeholders when building raw SQL expressions**

When constructing custom SQL expressions with `clause.Expr` or `clause.NamedExpr`, always use parameter placeholders in the SQL string and pass user inputs separately via the Vars slice or named arguments.

```go
expr := clause.Expr{
    SQL:  "role = ? AND status = ?",
    Vars: []interface{}{userRole, userStatus},
}
```

**Rule 3: Use parameterized placeholders for untrusted inputs in Where Conditions**

Never concatenate untrusted user input directly into query strings. Use `?` placeholders and pass user inputs as separate arguments.

```go
db.Where("username = ? AND status = ?", userInput, "active")
```

**Rule 4: Parameterize raw JOIN clauses to prevent SQL injection**

When constructing custom JOIN clauses with user-supplied parameters, pass raw SQL fragments using parameter placeholders or named arguments instead of string concatenation.

```go
DB.Joins("INNER JOIN pets ON pets.user_id = users.id AND pets.name = ?", userInputName).
	Where("users.name = ?", username).
	Find(&users)
```
