# Security cards

Repository: `https://github.com/typeorm/typeorm#1.1.0`
Category: resource exhaustion

## resource exhaustion

### Configure Query Execution Timeouts and Limits to Prevent Resource Exhaustion

**Use when**

Configuring database connections and executing queries in TypeORM to bound execution time and prevent resource starvation.

**Secure rules**

**Rule 1: Set query execution timeouts within the driver options to limit query duration and prevent connection pool exhaustion.**

Enable query timeouts by setting `enableQueryTimeout` to true and specifying a `maxQueryExecutionTime` limit in milliseconds within your `DataSource` driver options. This bounds query duration and mitigates connection pool starvation from unbounded operations.

```typescript
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "db_user",
    password: "db_password",
    database: "app_db",
    enableQueryTimeout: true,
    maxQueryExecutionTime: 5000,
    entities: []
});
```
