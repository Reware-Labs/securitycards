# Security cards

Repository: `https://github.com/feathersjs/feathers#v5.0.46`
Category: api contract misuse

## api contract misuse

### Safely Access Internal Knex Errors Server-Side

**Use when**

Handling and logging database exceptions thrown by the `@feathersjs/knex` adapter without leaking sensitive database details to clients.

**Secure rules**

**Rule 1: Retrieve the raw database error via the exported `ERROR` symbol for server-side logging while returning sanitized Feathers errors to remote clients.**

The `@feathersjs/knex` adapter automatically converts database exceptions into generic Feathers errors to prevent leaking database layout and SQL error details. When debugging or logging server-side errors, retrieve the raw database error using the exported `ERROR` symbol without re-exposing raw error properties to remote clients.

```typescript
import { ERROR } from '@feathersjs/knex'

try {
  await knexService.create(data)
} catch (error: any) {
  const rawKnexError = error[ERROR]
  logger.error('Database operation failed', { rawKnexError })
  throw error
}
```
