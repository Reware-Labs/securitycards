# Security cards

Repository: `https://github.com/laravel/framework#v13.22.0`
Documentation repository: `https://github.com/laravel/docs#13.x`
Category: injection

## injection

### Prevent SQL injection by using query builder parameter binding instead of raw expressions

**Use when**

When constructing database queries using user-controlled input in Laravel.

**Secure rules**

**Rule 1: Use standard Query Builder methods for parameter binding instead of passing user input into raw SQL expressions.**

Standard Query Builder methods automatically bind values as PDO parameters. Avoid passing user-controlled input directly into raw SQL expressions such as Illuminate\Database\Query\Expression or DB::raw() because raw expressions bypass parameter binding entirely.

```php
// Unsafe: Passing user input into a raw expression
$builder->whereDate('created_at', new Raw($request->input('date')));

// Safe: Using query builder parameter binding
$builder->whereDate('created_at', '=', $request->input('date'));
```
