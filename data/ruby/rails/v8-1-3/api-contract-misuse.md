# Security cards

Repository: `https://github.com/rails/rails#v8.1.3`
Category: api contract misuse

## api contract misuse

### Query composite primary key models using correct parameter methods

**Use when**

Querying database models that utilize composite primary keys using Active Record finder methods.

**Secure rules**

**Rule 1: Use `id_value` or explicit parameter collections instead of passing `model.id` arrays to `find_by(id:)` when querying composite primary key models.**

When interacting with composite primary key models, passing `model.id` to `find_by(id:)` causes Active Record to interpret the array as an `IN` query on a single column instead of evaluating the composite key tuple. Use `find_by(id: model.id_value)` to target the correct single column or `find(composite_key_array)` for accurate lookups.

```ruby
# Safe: use id_value to query only the :id column
Customer.find_by(id: customer.id_value)

# Safe: use find for exact composite primary key lookup
Customer.find([5, 10])
```
