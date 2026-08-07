# Security cards

Repository: `https://github.com/feathersjs/feathers#v5.0.46`
Category: security control integrity

## security control integrity

### Prevent Security Control Bypasses by Routing Requests Through Feathers Services and Hooks

**Use when**

Developing Feathers service methods, custom authentication services, internal adapter operations, or handling request execution paths where security controls like hooks and setup initialization must remain consistently applied.

**Secure rules**

**Rule 1: Always call super.setup when subclassing AuthenticationService.**

When overriding the `setup` method in a custom `AuthenticationService` subclass, you must always invoke `super.setup(path, app)` to ensure signing secrets are validated and internal authentication hooks are correctly registered.

```typescript
class MyAuthService extends AuthenticationService {
  setup(path: string, app: Application) {
    super.setup(path, app)
    // Custom setup logic
  }
}
```

**Rule 2: Enforce security checks within Feathers hooks rather than Express middleware.**

Implement authorization checks, input validation, and access control inside Feathers hooks instead of Express middleware to prevent bypasses when clients communicate over non-REST transports such as WebSockets.

```typescript
app.service('todos').hooks({
  before: {
    all: [
      async (context) => {
        if (!context.params.user) {
          throw new Error('Not authenticated')
        }
      }
    ]
  }
})
```

**Rule 3: Manually enforce security validation when calling internal adapter methods.**

When invoking underscore-prefixed adapter methods such as `_find`, `_get`, `_update`, `_patch`, or `_remove`, recognize that they bypass standard hooks, and you must explicitly perform authorization checks and input validation inside your method body.

```typescript
import { KnexAdapter } from '@feathersjs/knex'
import { Forbidden } from '@feathersjs/errors'

export class MessageService extends KnexAdapter<Message, MessageData, MessageParams, MessagePatch> {
  async find(params: MessageParams) {
    if (!params.user) {
      throw new Forbidden('User must be authenticated')
    }
    const page = await this._find(params)
    return { status: 'ok', ...page }
  }
}
```
