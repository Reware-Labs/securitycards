# Security cards

Repository: `https://github.com/rails/rails#v8.1.3`
Category: escape hatch

## escape hatch

### Restrict raw SQL fragments and avoid bypassing ActiveRecord query sanitization

**Use when**

When constructing database queries using raw SQL fragments or low-level ordering and clause methods in ActiveRecord.

**Secure rules**

**Rule 1: Only use Arel.sql for hardcoded, known-safe SQL literals or internal string constants, and never pass unvalidated user input or parameters directly into it.**

Using Arel.sql marks string arguments as trusted SQL literals which bypasses Rails internal raw SQL detection and security checks, creating direct SQL injection vectors. Combine Arel.sql for structural clauses with positional parameters for user input.

```ruby
safe_order_clause = Post.sanitize_sql_for_order([Arel.sql("field(id, ?)"), params[:ids]])
@posts = Post.order(safe_order_clause)
```
