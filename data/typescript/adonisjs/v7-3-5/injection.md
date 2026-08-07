# Security cards

Repository: `https://github.com/adonisjs/core#v7.3.5`
Documentation repository: `https://github.com/adonisjs/v7-docs#main`
Category: injection

## injection

### Use Parameterized Queries and Query Builder to Prevent SQL Injection

**Use when**

Building database queries with dynamic user input using Lucid query builder or raw queries.

**Secure rules**

**Rule 1: Use Lucid's fluent query builder or parameterized raw queries instead of manually interpolating dynamic inputs into raw SQL strings.**

Prevent SQL injection vulnerabilities by using Lucid query builder methods or by passing parameter bindings explicitly when using raw queries via `db.rawQuery`.

```typescript
// Safe: using query builder with parameterized arguments
const posts = await db
  .from('posts')
  .select('*')
  .where('status', request.input('status'))

// Safe: passing array bindings with rawQuery
const dynamicStatus = request.input('status')
const rawResult = await db.rawQuery('select * from posts where status = ?', [dynamicStatus])
```
