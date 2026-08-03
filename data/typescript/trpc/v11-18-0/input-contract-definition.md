# Security cards

Repository: `https://github.com/trpc/trpc#v11.18.0`
Category: input contract definition

## input contract definition

### Define runtime input validation schemas for tRPC procedures

**Use when**

Building and securing tRPC queries, mutations, or subscription procedures that accept untrusted client inputs.

**Secure rules**

**Rule 1: Always specify explicit runtime input schemas using `.input()` with validation libraries like Zod.**

Use validation libraries such as Zod to define explicit input schemas on tRPC procedures via the `.input()` method. This ensures all untrusted client data is thoroughly parsed, validated, and rejected if malformed before reaching query, mutation, or subscription handlers.

```typescript
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();

export const appRouter = t.router({
  getUser: t.procedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ input }) => {
      return { id: input.id };
    }),
});
```
