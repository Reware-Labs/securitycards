# Security cards

Repository: `https://github.com/feathersjs/feathers#v5.0.46`
Category: input contract definition

## input contract definition

### Validate Request Payloads and Query Parameters with Strict Schemas

**Use when**

Defining and validating incoming service data and query parameters using schema hooks to reject malformed input and unexpected properties.

**Secure rules**

**Rule 1: Enforce strict schema validation for both data and query**

Define TypeBox / JSON-Schema definitions with `additionalProperties: false` to forbid extra fields, compile them into validator functions, and apply **both** `schemaHooks.validateData` **and** `schemaHooks.validateQuery` so that malformed payloads or query parameters are rejected before service logic runs.

```ts
import { hooks as schemaHooks } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { dataValidator, queryValidator } from '../validators'

// ─── Data schema ───────────────────────────────────────────────────────────────
const userDataSchema = Type.Object(
  {
    email:    Type.String({ format: 'email' }),
    password: Type.String({ minLength: 8 })
  },
  { $id: 'UserData', additionalProperties: false } // unknown props rejected
)
const userDataValidator = getValidator(userDataSchema, dataValidator)

// ─── Query schema ──────────────────────────────────────────────────────────────
const userQueryProperties = Type.Pick(userDataSchema, ['email'])
const userQuerySchema = Type.Intersect(
  [
    querySyntax(userQueryProperties),            // Feathers query helpers
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
const userQueryValidator = getValidator(userQuerySchema, queryValidator)

// ─── Hook registration ────────────────────────────────────────────────────────
app.service('users').hooks({
  around: {
    all: [
      schemaHooks.validateQuery(userQueryValidator), // validates ?query params
      schemaHooks.validateData(userDataValidator)    // validates request body
    ]
  }
})
```
