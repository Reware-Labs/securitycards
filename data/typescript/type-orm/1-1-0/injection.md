# Security cards

Repository: `https://github.com/typeorm/typeorm#1.1.0`
Category: injection

## injection

### Avoid Passing Function Callbacks as Query Parameter Values

**Use when**

When configuring parameter maps or object literals for database query execution across TypeORM drivers.

**Secure rules**

**Rule 1: Never pass function callbacks or user-influenced functions as parameter values in query parameter maps.**

Several database drivers execute parameter values defined as functions and concatenate their string returns directly into the SQL statement without parameterization or escaping. Always supply primitive scalar values, dates, or arrays directly in query parameter maps.

```typescript
const result = await queryRunner.query(
  "SELECT * FROM user WHERE status = :status AND id = :id",
  { status: userInputStatus, id: userId }
);
```


### Use Parameterized Queries and Placeholders for Dynamic Database Operations

**Use when**

When building SQL queries or executing raw statements using TypeORM query builders, repositories, entity managers, or database drivers with dynamic values.

**Secure rules**

**Rule 1: Always bind dynamic or untrusted user input using named or positional parameter placeholders rather than raw string concatenation.**

Concatenating untrusted variables directly into database query strings allows attackers to manipulate SQL commands and execute arbitrary queries. Always pass dynamic values through parameter bindings or repository search criteria options to ensure TypeORM safely parameterizes and escapes the inputs.

```typescript
const posts = await dataSource
  .createQueryBuilder(Post, "post")
  .where("post.name = :name", { name: userInput })
  .getMany();
```


### Validate Dynamic Identifiers and Enable Strict Isolation Settings

**Use when**

When constructing database schema inspections, DDL statements, sorting options, or complex conditional query clauses with untrusted identifiers or logical conditions.

**Secure rules**

**Rule 1: Validate dynamic SQL identifiers before raw interpolation in the `sql` tag**

When you embed a table, schema, or column name in a TypeORM **`sql`** tagged template by returning a string from a function expression, that string is inserted into the query **without any escaping or parameterization**. Never pass user-controlled values here. Instead, verify the identifier against a strict allow-list (or another strong validation routine) before inserting it.

```typescript
// Accept only known-safe table names
const ALLOWED_TABLES = new Set(["posts", "comments", "users"]);
const tableName = userInput.trim();

if (!ALLOWED_TABLES.has(tableName)) {
  throw new Error("Invalid table name");
}

// Safe: validated table name is inserted as raw SQL
const rows = await dataSource.sql`
  SELECT * FROM ${() => tableName}
`;
```

**Rule 2: Enable `isolateWhereStatements` to enclose each WHERE condition in parentheses**

Set `isolateWhereStatements: true` in your **DataSource** configuration so that TypeORM 1.1.0 automatically wraps every provided WHERE expression in brackets, ensuring compound `OR` conditions are correctly grouped when combined with additional filters.

```typescript
const dataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "user",
    password: "pass",
    database: "app",
    entities: [User],
    isolateWhereStatements: true,   // activates automatic brackets
});

await dataSource.initialize();

const sql = dataSource
  .createQueryBuilder(User, "user")
  .where("user.id = :id", { id: 1 })
  .andWhere("user.firstName = :s OR user.lastName = :s", { s: "alice" })
  .getSql();
// … WHERE user.id = ? AND (user.firstName = ? OR user.lastName = ?)
```
