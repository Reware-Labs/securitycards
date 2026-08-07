# Security cards

Repository: `https://github.com/phoenixframework/phoenix#v1.8.9`
Category: injection

## injection

### Parameterize dynamic database queries and avoid SQL string interpolation

**Use when**

Building dynamic queries and database fragments in applications using Ecto or raw SQL queries

**Secure rules**

**Rule 1: Always parameterize dynamic values in Ecto queries using Ecto query syntax, parameter bindings in `fragment/2`, or parameter placeholders in raw SQL queries.**

Prevent SQL injection vulnerabilities by ensuring untrusted user input is never directly interpolated into SQL strings or fragments. Use parameter binding mechanisms such as `^min_q` or positional parameters like `$1`.

```elixir
# Safe Ecto fragment binding
from(f in Fruit, where: fragment("f0.quantity >= ? AND f0.secret = FALSE", ^min_q))

# Safe raw SQL query binding
Ecto.Adapters.SQL.query(Repo, "SELECT * FROM fruits WHERE quantity > $1 AND secret = FALSE", [min_q])
```
