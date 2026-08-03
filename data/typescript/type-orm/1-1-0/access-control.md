# Security cards

Repository: `https://github.com/typeorm/typeorm#1.1.0`
Category: access control

## access control

### Restrict database connections to read-only mode for query-only operations

**Use when**

Configuring database connections in applications where write access is not required or should be restricted to enforce tenant isolation and least privilege access.

**Secure rules**

**Rule 1: Open better-sqlite3 connections in read-only mode when writes are not required**

For a `better-sqlite3` data source that should not perform writes, set `readonly: true`. This supported driver option opens the database connection in read-only mode.

```typescript
import { DataSource } from "typeorm"

export const AppDataSource = new DataSource({
    type: "better-sqlite3",
    database: "mydb.sqlite",
    readonly: true,
})
```
