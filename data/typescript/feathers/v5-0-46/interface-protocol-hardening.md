# Security cards

Repository: `https://github.com/feathersjs/feathers#v5.0.46`
Category: interface protocol hardening

## interface protocol hardening

### Secure Inter-Component Communication and Transport Boundaries

**Use when**

Use when designing inter-component calls, configuring service methods, managing real-time channels, and transferring authentication context across network and application component boundaries.

**Secure rules**

**Rule 1: Propagate authenticated entity context during internal service calls**

When performing internal inter-component service calls within the application, propagate the existing authenticated context directly in `params` instead of re-passing raw authentication credentials. This safely maintains identity and security context across component boundaries.

```ts
const userMessage = await app.service('messages').create(data, {
  ...context.params,
  authentication: context.params.authentication,
  user: context.params.user
})
```

**Rule 2: Restrict service methods exposed to remote client communications**

Explicitly declare the set of service methods accessible to remote clients using the `methods` option when calling `app.use()`. Omitting this option automatically exposes all standard service methods over configured network transports.

```ts
app.use('messages', new MessageService(), {
  methods: ['get', 'doSomething'],
  events: ['something']
})
```

**Rule 3: Manage channel memberships dynamically during authentication events**

Explicitly bind real-time connections to authorized channels on login and revoke channel access on logout or user role updates by moving connection objects out of anonymous channels and into authorized ones.

```ts
app.on('login', (payload: AuthenticationResult, { connection }: Params) => {
  if (connection) {
    app.channel('anonymous').leave(connection)
    app.channel('authenticated').join(connection)
    if (connection.user.isAdmin) {
      app.channel('admins').join(connection)
    }
  }
})
```

**Rule 4: Invoke services through `app.service(path)` to ensure hooks and security run**

Always call the standard service methods (`find`, `get`, `create`, `update`, `patch`, `remove`) on the instance returned by `app.service(path)`. This is the only way Feathers applies its built-in functionality—hooks, authentication/authorization, validation, events, pagination, etc. Avoid bypassing these controls:

* **Do not** call the original service class or object you registered with `app.use`.
* **Do not** use the underscore variants (`_get`, `_find`, `_create`, `_patch`, `_update`, `_remove`) unless you explicitly intend to skip hooks and related safeguards.

```ts
// Recommended: full Feathers processing (hooks, auth, events, etc.)
const item = await app.service('messages').get(1)

//  Bypasses hooks and other framework protections
// const rawService = new MessageService()
// const insecure = await rawService.get(1)
// const noHooks = await app.service('messages')._get(1)
```
