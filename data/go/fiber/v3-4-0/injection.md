# Security cards

Repository: `https://github.com/gofiber/fiber#v3.4.0`
Category: injection

## injection

### Validate Dynamic Sort Parameters Using an Allowlist

**Use when**

When accepting dynamic sort parameters from user-driven query strings for database sorting in Fiber applications.

**Secure rules**

**Rule 1: Explicitly configure allowed sort fields using an allowlist to prevent arbitrary or unsafe column ordering.**

Specify allowed sort fields within `paginate.Config` to restrict user input to known safe database column names and prevent exposure of internal table structures or injection risks.

```go
app.Use(paginate.New(paginate.Config{
    SortKey:      "sort",
    DefaultSort:  "created_at",
    AllowedSorts: []string{"id", "name", "created_at"},
}))
```
