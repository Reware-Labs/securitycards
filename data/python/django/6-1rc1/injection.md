# Security cards

Repository: `https://github.com/django/django#6.0.7`
Category: injection

## injection

### Use Parameterized Queries and Structured Expressions for Database Operations

**Use when**

Building database queries with Django QuerySets, raw SQL strings, or expression functions where untrusted user input is involved.

**Secure rules**

**Rule 1: Use QuerySet parameterization or parameterized raw queries instead of concatenating untrusted strings into SQL statements.**

Rely on Django `QuerySet` parameterization or raw queries with explicit parameter bindings such as `%s` to prevent arbitrary SQL execution. Avoid direct string formatting or raw queries like `extra()` and `RawSQL` without parameterized inputs.

```python
Entry.objects.filter(title=user_input)

Entry.objects.raw('SELECT * FROM myapp_entry WHERE title = %s', [user_input])
```

**Rule 2: Pass untrusted input to database function expressions safely via positional arguments or Value wrappers.**

Do not pass untrusted user input as keyword arguments `**extra`, `extra_context`, or expression parameters like `output_field` to `Func()` or database function expressions because they interpolate directly into SQL templates. Use positional expression arguments or `Value()` wrappers instead so Django passes them as query parameters.

```python
queryset.annotate(field_lower=Func(Value(user_input), function="LOWER"))
```
