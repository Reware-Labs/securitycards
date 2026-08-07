# Security cards

Repository: `https://github.com/feathersjs/feathers#v5.0.46`
Category: boundary control

## boundary control

### Enforce Boundary Checks and Sanitize External Input at the Server Interface

**Use when**

Handling incoming requests from untrusted clients, extracting parameters from query contexts, or distinguishing external transport requests from internal service calls.

**Secure rules**

**Rule 1: Validate and sanitize custom client parameters extracted from the query context before assigning them to server context properties.**

When extracting custom client parameters from `params.query` on the server, developers must explicitly sanitize and validate all client-supplied values to prevent authorization bypasses or context manipulation.

```typescript
app.hooks({
  before: {
    all: [
      async (context: HookContext) => {
        const { $client = {}, ...query } = context.params.query || {}
        const platform = typeof $client.platform === 'string' ? $client.platform : 'unknown'
        context.params = {
          ...context.params,
          platform,
          query
        }
      }
    ]
  }
})
```

**Rule 2: Distinguish external transport requests from internal service calls using context parameters.**

Use `context.params.provider` to check if a request originated externally via REST or Socket.io and enforce authentication and boundary checks accordingly.

```typescript
export const enforceExternalCheck = async (context: HookContext) => {
  if (context.params.provider) {
    if (!context.params.user) {
      throw new Error('Unauthenticated external request')
    }
  }
}
```

**Rule 3: Prevent untrusted clients from directly passing internal database flags or aggregation parameters.**

Construct sensitive parameters such as `params.pipeline` and `params.mongodb` server-side inside hooks or service methods based on authenticated context, rather than accepting them directly from client requests.

```typescript
export const restrictUserPages = async (context: HookContext) => {
  context.params.pipeline = [
    { $match: { userId: context.params.user._id } }
  ]
}
```
