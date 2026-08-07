# Security cards

Repository: `https://github.com/feathersjs/feathers#v5.0.46`
Category: access control

## access control

### Configure Platform Permissions and Authorization Controls

**Use when**

When managing user permissions, capabilities, roles, and administrative update boundaries across Feathers services and authentication flows.

**Secure rules**

**Rule 1: Embed user permissions into JWT payloads via getPayload**

Override `AuthenticationService.getPayload` to bind user authorization claims into the signed JWT payload. Always call `super.getPayload(authResult, params)` first to maintain standard token claims before appending permissions.

```ts
import type { Params } from '@feathersjs/feathers'
import type { AuthenticationResult } from '@feathersjs/authentication'
import { AuthenticationService } from '@feathersjs/authentication'

class CustomAuthService extends AuthenticationService {
  async getPayload(authResult: AuthenticationResult, params: Params) {
    const payload = await super.getPayload(authResult, params)
    const { user } = authResult

    if (user && user.permissions) {
      payload.permissions = user.permissions
    }

    return payload
  }
}

app.use('/authentication', new CustomAuthService(app))
```

**Rule 2: Restrict real-time events to authenticated channels**

Create dedicated channels and publish events exclusively to channels that contain authenticated (and, if needed, further authorized) connections. On every new socket connection, join it to a low-privilege `anonymous` channel; after successful authentication, move the connection to `authenticated` (or a role-specific channel) and publish events only to that channel.

```ts
// channels.ts
import type { RealTimeConnection, Params } from '@feathersjs/feathers'
import type { AuthenticationResult } from '@feathersjs/authentication'

app.on('connection', (connection: RealTimeConnection) => {
  // All new sockets start as anonymous
  app.channel('anonymous').join(connection)
})

app.on('login', (payload: AuthenticationResult, { connection }: Params) => {
  if (connection) {
    // Upgrade the socket: leave anonymous, join authenticated
    app.channel('anonymous').leave(connection)
    app.channel('authenticated').join(connection)
  }
})

// Publish every service event only to authenticated users
app.publish((_data, _context) => app.channel('authenticated'))
```

**Rule 3: Keep stateless JWTs short-lived when embedding permissions**

If you configure the `JWT` strategy with `"entity": null`, the token becomes *stateless*: all data (including user permissions) is baked into the payload and **cannot be revoked or updated** before the token expires. Mitigate this risk by issuing tokens with a deliberately short `expiresIn` setting.

```js
// authentication configuration (e.g. config/default.json)
{
  "authentication": {
    "secret": "CHANGE_ME",
    "entity": null,              // make JWT stateless
    "authStrategies": ["jwt"],
    "jwtOptions": {
      "expiresIn": "15m"         // short-lived token limits stale permissions
    }
  }
}

const { AuthenticationService } = require('@feathersjs/authentication')

class MyAuthService extends AuthenticationService {
  // Embed current permissions into the stateless token
  async getPayload (authResult, params) {
    const payload = await super.getPayload(authResult, params)
    const { user } = authResult
    if (user?.permissions) payload.permissions = user.permissions
    return payload
  }
}

app.use('/authentication', new MyAuthService(app))
```


### Enforce User Data Isolation and Access Controls in Feathers Services and Resolvers

**Use when**

Use when implementing access control restrictions, tenant isolation, and role checks within Feathers service hooks and query resolvers to prevent unauthorized cross-user data access and mutations.

**Secure rules**

**Rule 1: Enforce explicit role checks and authentication state inside service hooks**

Verify that `context.params.user` is present and has the required permissions or roles before allowing service execution to prevent unauthorized database access.

```typescript
app.service('messages').hooks({
  before: {
    all: [
      async (context) => {
        if (!context.params.user) {
          throw new Error('Unauthenticated');
        }
      }
    ]
  }
});
```


### Restrict External Service Calls and Query Filters Using Provider and Schema Resolvers

**Use when**

Use when securing service endpoints against external transport exposure and binding query filters to authenticated user or tenant ownership constraints.

**Secure rules**

**Rule 1: Restrict internal service methods from external transport invocation using provider context checks**

Check `context.params.provider` inside service hooks to block unauthorized external callers from invoking administrative or internal-only methods via REST.

```typescript
import { HookContext } from '@feathersjs/feathers'

app.service('users').hooks({
  before: {
    remove: [
      async (context: HookContext) => {
        if (context.params.provider === 'rest') {
          throw new Error('User deletion is not allowed via REST')
        }
      }
    ]
  }
})
```

**Rule 2: Enforce user and tenant scoping in query resolvers using schema hooks**

Use `schemaHooks.resolveQuery` to bind incoming request query filters directly to `context.params.user` to prevent unauthorized access across tenants.

```typescript
import { hooks as schemaHooks, resolve } from '@feathersjs/schema'

export const companyFilterQueryResolver = resolve<Company, HookContext>({
  ownerUser: (value, obj, context) => {
    if (context.params.user) {
      return context.params.user.id
    }
    return value
  }
})

app.service('companies').hooks({
  before: {
    all: [schemaHooks.resolveQuery(companyFilterQueryResolver)]
  }
})
```
