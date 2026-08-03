# Security cards

Repository: `https://github.com/drizzle-team/drizzle-orm#0.45.2`
Category: input contract definition

## input contract definition

### Validate Incoming Request Payloads and Schema Data Using Strict Schemas

**Use when**

When validating HTTP request payloads, CLI options, database schema snapshots, and serialized configuration inputs before processing application data.

**Secure rules**

**Rule 1: Validate request JSON with a Drizzle-generated Zod schema before executing queries**

Derive a Zod schema from your table definition using `createInsertSchema()` (or `createUpdateSchema()`/`createSelectSchema()` as appropriate). Parse the incoming JSON with that schema and use the parsed result in your Drizzle calls—never trust raw request bodies.

```typescript
import express from 'express';
import { pgTable, text, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-orm/zod';

const users = pgTable('users', {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  name: text().notNull(),
  age: integer().notNull(),
});

const userInsertSchema = createInsertSchema(users); // Zod validator

const app = express();
app.use(express.json());

app.post('/users', async (req, res) => {
  const data = userInsertSchema.parse(req.body); // validated JSON
  await db.insert(users).values(data);
  res.status(201).json({ id: data.id });
});
```

**Rule 2: Validate raw CLI options and configuration inputs using schema safe parsing.**

Always validate incoming input objects against strict schema contracts using safe parsing methods like `safeParse` before executing actions, and handle failures explicitly by exiting execution.

```typescript
const raw = flattenDatabaseCredentials(options);
const parsed = pushParams.safeParse(raw);
if (!parsed.success) {
  console.log('Please provide required params');
  process.exit(1);
}
const config = parsed.data;
```

**Rule 3: Enforce strict Zod schema validation when parsing PostgreSQL schema snapshots.**

Strictly validate incoming payloads against predefined Zod schema contracts using `.parse()` to prevent unexpected properties or malformed schema definitions from bypassing structural checks.

```typescript
import { pgSchema } from 'drizzle-kit/serializer/pgSchema';

function processSnapshotInput(rawSnapshot: unknown) {
  const validatedSchema = pgSchema.parse(rawSnapshot);
  return validatedSchema;
}
```
