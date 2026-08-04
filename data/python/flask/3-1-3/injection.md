# Security cards

Repository: `https://github.com/pallets/flask#3.1.3`
Category: injection

## injection

### Use Parameterized Queries to Prevent SQL Injection

**Use when**

Writing database queries with dynamic user input in Flask applications.

**Secure rules**

**Rule 1: Pass dynamic parameters separately from the SQL statement using placeholders.**

When executing SQL statements or database commands, always pass user-supplied input as parameterized arguments using placeholders such as `?` or named parameters rather than using string interpolation, formatting, or concatenation.

```python
db = get_db()
db.execute(
    'INSERT INTO post (title, body, author_id) VALUES (?, ?, ?)',
    (title, body, g.user['id'])
)
db.commit()
```
