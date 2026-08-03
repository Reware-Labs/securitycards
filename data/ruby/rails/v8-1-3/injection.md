# Security cards

Repository: `https://github.com/rails/rails#v8.1.3`
Category: injection

## injection

### Use Parameterized Queries and Structured Scopes to Prevent SQL Injection

**Use when**

Building database queries, Common Table Expressions, or condition strings using Active Record methods with user-supplied input.

**Secure rules**

**Rule 1: Use parameterized queries or hash conditions with Active Record query methods**

Never interpolate untrusted or user-supplied parameters directly into SQL condition strings when calling Active Record query methods like `where`. Instead, use parameterized array conditions with positional placeholders, named placeholders, or hash conditions, which ensure parameter values are safely escaped and sanitized by Active Record.

```ruby
User.where("user_name = ? AND password = ?", params[:user_name], params[:password])

# Or using hash conditions:
User.where(user_name: params[:user_name], password: params[:password])
```

**Rule 2: Pass subqueries as ActiveRecord Relation objects or Arel constructs when defining Common Table Expressions**

When defining Common Table Expressions via `with` or `with_recursive`, pass subqueries as `ActiveRecord::Relation` objects or safe `Arel` constructs rather than raw, unsanitized user string inputs to avoid SQL injection vulnerabilities.

```ruby
# Safe: Using ActiveRecord::Relation
Post.with(posts_with_tags: Post.where("tags_count > ?", min_tags))

# Safe: Using Arel.sql only with sanitized/static expressions
Post.with(popular_posts: Arel.sql("SELECT * FROM posts WHERE view_count > 100"))
```

**Rule 3: Use parameterized arrays or hashes with sanitize_sql methods**

Always pass conditions or assignments as parameterized arrays or hashes when using `sanitize_sql_for_conditions`, `sanitize_sql_for_assignment`, or `sanitize_sql_array`. Do not pass plain SQL strings containing interpolated user input, as these methods return plain strings unmodified without performing sanitization.

```ruby
# Safe: Use array positional bind variables
sanitized_conditions = Post.sanitize_sql_for_conditions(["name = ? AND status = ?", params[:name], params[:status]])

# Safe: Use named bind variables in array format
sanitized_conditions = Post.sanitize_sql_for_conditions(["name = :name AND status = :status", name: params[:name], status: params[:status]])

# Safe: Use hash format for assignments
sanitized_assignment = Post.sanitize_sql_for_assignment({ status: params[:status], category: params[:category] })
```
