# Security cards

Repository: `https://github.com/feathersjs/feathers#v5.0.46`
Category: deserialization

## deserialization

### Enforce Schema Type Coercion and Validation for REST Query Deserialization

**Use when**

When processing incoming requests over HTTP REST transports where query parameters are deserialized strictly as strings.

**Secure rules**

**Rule 1: Validate and coerce query parameters with `schemaHooks.validateQuery`**

Always run incoming query parameters through a schema-based validator that has **type-coercion enabled**.
Use a TypeBox schema, compile it with `getValidator` and the `queryValidator` (configured with `coerceTypes: true`), and register the resulting function via `schemaHooks.validateQuery` in a `before` or `around` hook. This guarantees that strings like `"true"` or `"42"` are converted to booleans or numbers before they reach your database adapter.

```ts
import { schemaHooks } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { queryValidator } from '../validators'

//  Define the allowed query properties
const todoQueryProps = Type.Object({
  status: Type.Optional(Type.String()),
  completed: Type.Optional(Type.Boolean())
}, { additionalProperties: false })

// Add Feathers query operators ($limit, $sort, …)
const todoQuerySchema = querySyntax(todoQueryProps)

// Compile the validator (coercion is enabled in queryValidator)
const todoQueryValidator = getValidator(todoQuerySchema, queryValidator)

// Enforce it in a hook
app.service('todos').hooks({
  around: {
    all: [schemaHooks.validateQuery(todoQueryValidator)]
  }
})
```
