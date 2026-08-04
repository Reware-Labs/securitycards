# Security cards

Repository: `https://github.com/typeorm/typeorm#1.1.0`
Category: dangerous execution

## dangerous execution

### Disable Function Serialization in MongoDB DataSource Configuration

**Use when**

Configuring MongoDB database connections using `DataSource` in TypeORM.

**Secure rules**

**Rule 1: Ensure `serializeFunctions` remains false in MongoDB `DataSource` options to prevent serializing JavaScript functions into BSON documents.**

Set `serializeFunctions` explicitly to `false` in your MongoDB `DataSource` configuration to prevent functions attached to objects from being encoded into BSON and stored in the database, thereby avoiding subsequent remote code execution or function injection risks.

```typescript
import { DataSource } from "typeorm"

export const AppDataSource = new DataSource({
    type: "mongodb",
    host: "localhost",
    port: 27017,
    database: "test",
    serializeFunctions: false,
})
```
