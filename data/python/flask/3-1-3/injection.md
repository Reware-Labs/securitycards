# Security cards

Repository: `https://github.com/pallets/flask#3.1.3`
Category: injection

## injection

### Use Parameterized Queries to Prevent SQL Injection

**Use when**

Writing database queries with dynamic user input, or recording user-controlled values in application logs.

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

**Rule 2: Strip or escape carriage returns, line feeds, and other control characters before writing a user-controlled value to a log.**

A value containing `\r` or `\n` forges additional log lines, letting an attacker fabricate entries or hide their own activity from anything that reads the log. Neutralize control characters before the value reaches the logger, and pass it as a logging argument rather than interpolating it into the message.

```python
def log_safe(value: str) -> str:
    return value.encode("unicode_escape").decode("ascii")

app.logger.info("login failed for user=%s", log_safe(username))
```
