# Security cards

Repository: `https://github.com/typeorm/typeorm#1.1.0`
Category: configuration source integrity

## configuration source integrity

### Configure Explicit DataSource Settings and Avoid Unsafe Synchronization Defaults

**Use when**

Initializing TypeORM DataSource configurations for production and development environments.

**Secure rules**

**Rule 1: Ensure automatic schema synchronization is disabled in production environments.**

Set `synchronize: false` in production environments when initializing `DataSource` to prevent unintended database table drops or column alterations. Rely on managed database migrations instead of automatic schema synchronization.

```typescript
import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entities/User"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: process.env.NODE_ENV !== "production",
    logging: false,
    entities: [User],
    migrations: [],
    subscribers: [],
})
```
