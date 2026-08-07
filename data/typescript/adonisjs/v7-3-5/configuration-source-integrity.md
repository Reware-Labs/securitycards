# Security cards

Repository: `https://github.com/adonisjs/core#v7.3.5`
Documentation repository: `https://github.com/adonisjs/v7-docs#main`
Category: configuration source integrity

## configuration source integrity

### Validate configuration source values using strict environment schemas

**Use when**

Validating and restricting allowed environment variables at application startup to ensure configuration integrity.

**Secure rules**

**Rule 1: Validate environment variables using strict schema definitions to restrict allowed configuration values.**

Use `Env.schema.enum()` inside `start/env.ts` to explicitly validate environment variables like `LIMITER_STORE` against a fixed set of trusted options. This prevents unexpected configuration overrides or fallback to unintended storage backends.

```typescript
import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  LIMITER_STORE: Env.schema.enum(['redis', 'database', 'memory'] as const),
})
```
