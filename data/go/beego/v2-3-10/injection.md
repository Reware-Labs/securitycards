# Security cards

Repository: `https://github.com/beego/beego#v2.3.10`
Category: injection

## injection

### Use Parameterized Queries in Beego ORM and QueryBuilders

**Use when**

Building database queries, raw SQL statements, or query builder expressions using Beego ORM.

**Secure rules**

**Rule 1: Use parameter placeholders and separate argument binding instead of string concatenation in raw queries and query builders.**

When executing raw database queries or constructing queries with query builders, supply variable inputs using parameter placeholders such as `?` rather than formatting or concatenating untrusted input strings directly into the SQL query.

```go
var list []*DataNull
num, err := dORM.Raw("SELECT * FROM data_null WHERE id = ?", userID).QueryRows(&list)
```
