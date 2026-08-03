# Security cards

Repository: `https://github.com/prisma/prisma#7.8.0`
Category: interface protocol hardening

## interface protocol hardening

### Instantiate Prisma Client with a Mandatory Driver Adapter

**Use when**

Initializing PrismaClient in Prisma version 7.8.0.

**Secure rules**

**Rule 1: Always provide a mandatory driver adapter when instantiating PrismaClient.**

In Prisma version 7.8.0 and later, the Prisma Client requires a driver adapter to manage database communication. Ensure you explicitly instantiate the `PrismaClient` with a compatible driver adapter to establish a secure and functioning connection to your database.

```typescript
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from './generated/prisma/client'

const adapter = new PrismaBetterSqlite3({ url: 'file:prisma/dev.db' })
const prisma = new PrismaClient({ adapter })

// For D1 specific adapter:
// import { PrismaD1 } from '@prisma/adapter-d1'
// const adapter = new PrismaD1(env.MY_DATABASE);
// const prisma = new PrismaClient({ adapter });
```


**Source files**

- [`sandbox/basic-sqlite/index.ts`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/basic-sqlite/index.ts)
- [`sandbox/d1/src/index.ts`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/d1/src/index.ts)
