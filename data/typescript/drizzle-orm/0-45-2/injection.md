# Security cards

Repository: `https://github.com/drizzle-team/drizzle-orm#0.45.2`
Category: injection

## injection

### Parameterize Dynamic Queries and Expressions Using Template Tags

**Use when**

When building custom SQL queries, database clauses, or expressions where dynamic values or user input must be included securely.

**Secure rules**

**Rule 1: Always use Drizzle's `sql` template literal tag for custom SQL expressions and dynamic values instead of raw string concatenation.**

Dynamic variables passed inside template placeholders `${value}` are safely parameterized by the ORM instead of being interpolated into raw SQL strings. Avoid passing untrusted input or string interpolation to `sql.raw()` or `db.execute()`, which treat strings as raw unescaped SQL.

```typescript
import { sql } from 'drizzle-orm';

const userInput = 'John';

const users = await db
  .select({
    name: sql<string>`upper(${usersTable.name})`,
  })
  .from(usersTable)
  .where(sql`${usersTable.name} = ${userInput}`);
```


### Rely on Built-in Parameter Binding for Inserts and Session Operations

**Use when**

When populating insert values, calling database session methods, or passing arguments through proxy and driver integrations.

**Secure rules**

**Rule 1: Pass plain JavaScript literal values or dedicated parameter arrays to insert and session methods rather than concatenating strings.**

When populating insert values using `.values()`, pass standard JavaScript literal values directly so Drizzle ORM automatically wraps non-SQL object values into parameterized instances. When using low-level session query methods, supply dynamic inputs via designated parameter arrays rather than interpolating or concatenating string values directly into the query string.

```typescript
await db.insert(users).values({
  name: req.body.name,
  email: req.body.email
});
```


### Use `sql.identifier()` for Dynamic Table, Column, and Schema Names

**Use when**

When referencing dynamic table names, column names, or schema identifiers in custom queries or introspection operations.

**Secure rules**

**Rule 1: Validate untrusted identifier names against an allow-list before passing them to `sql.identifier()`**

`sql.identifier()` escapes the name but does not itself block injection—any attacker-supplied value must first be checked against a finite set of expected table/column names (or otherwise validated) and only then wrapped with `sql.identifier()`.

```typescript
import { sql } from 'drizzle-orm';

const ALLOWED_SORT_COLUMNS = ['id', 'created_at', 'name'] as const;

function safeIdentifier(name: string) {
  if (!ALLOWED_SORT_COLUMNS.includes(name as any)) {
    throw new Error('Invalid column name');
  }
  return sql.identifier(name);
}

// Usage in a request handler
const sortColumn = safeIdentifier(req.query.sortBy as string);

const rows = await db.execute(
  sql`select * from users order by ${sortColumn}`
);
```
