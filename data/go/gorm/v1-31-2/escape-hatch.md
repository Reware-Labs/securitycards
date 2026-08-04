# Security cards

Repository: `https://github.com/go-gorm/gorm#v1.31.2`
Category: escape hatch

## escape hatch

### Avoid Disabling Identifier Escaping on Untrusted Table and Column Names

**Use when**

When constructing database queries dynamically where table or column names might be influenced by user input.

**Secure rules**

**Rule 1: Do not set `Raw: true` on `clause.Column` or `clause.Table` structs when using dynamic or untrusted identifier names.**

Keep `Raw` set to `false` so that GORM automatically quotes identifiers. Disabling identifier escaping allows attackers to inject malicious SQL fragments into query structures since database drivers do not support standard positional parameter binding for table or column names.

```go
col := clause.Column{
	Table: "users",
	Name:  "email",
	Raw:   false,
}
```
