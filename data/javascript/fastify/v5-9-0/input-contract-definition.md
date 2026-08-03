# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: input contract definition

## input contract definition

### Define and Enforce Rigid Input Schemas in Fastify v5

**Use when**

Configuring validation schemas for request bodies, headers, query parameters, or route parameters in Fastify routes.

**Secure rules**

**Rule 1: Define full JSON schemas for querystring, params, and body schemas.**

Starting with Fastify v5, provide full JSON schemas for `querystring`, `params`, and `body` schemas. When using the default JSON Schema validator, include the `type` property; the `jsonShortHand` option has been removed.

```javascript
fastify.get('/route', {
  schema: {
    querystring: {
      type: 'object',
      properties: {
        name: { type: 'string' }
      },
      required: ['name']
    }
  }
}, (request, reply) => {
  reply.send({ hello: request.query.name })
})
```

**Rule 2: Define a TypeBox schema and derive its corresponding TypeScript type.**

For payload validation with TypeBox, define the schema with `Type`, create its corresponding type with `Static`, and use both the schema and type in the route definition.

```typescript
import { Static, Type } from 'typebox'
import Fastify from 'fastify'

const User = Type.Object({
  name: Type.String(),
  mail: Type.Optional(Type.String({ format: 'email' }))
})

type UserType = Static<typeof User>

const fastify = Fastify()

fastify.post<{ Body: UserType, Reply: UserType }>(
  '/',
  {
    schema: {
      body: User,
      response: {
        200: User
      }
    }
  },
  (request, reply) => {
    const { name, mail } = request.body
    reply.status(200).send({ name, mail })
  }
)
```

**Rule 3: Equip all accepted media types with an explicit schema when using split content validation.**

Defining validation on explicit media types using `schema.body.content` causes Fastify to silently skip validation for incoming content types not explicitly listed in that configuration map. Define validation rules for every single parsed content type.

```javascript
fastify.post('/submit', {
  schema: {
    body: {
      content: {
        'application/json': {
          schema: jsonSchema
        },
        'text/plain': {
          schema: {
            type: 'string',
            maxLength: 1000
          }
        }
      }
    }
  }
}, async (req, reply) => {
  return { success: true }
})
```

**Rule 4: Custom header schemas are compiled without automatic key lowercasing.**

For plain-object header schemas, Fastify lowercases entries in `required` and keys in `properties` before compiling the schema. When a custom validator is used or the header schema is not a plain object, Fastify compiles the supplied header schema without modifying it.


**Source files**

- [`docs/Guides/Migration-Guide-V5.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Migration-Guide-V5.md)
- [`docs/Reference/TypeScript.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/TypeScript.md)
- [`test/schema-validation.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/schema-validation.test.js)
- [`test/internals/validation.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/internals/validation.test.js)
- [`docs/Guides/Fluent-Schema.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Fluent-Schema.md)
