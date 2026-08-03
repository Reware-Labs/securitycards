# Security cards

Repository: `https://github.com/honojs/hono#v4.12.32`
Category: boundary control

## boundary control

### Isolate request state using Context set and get methods

**Use when**

Storing and retrieving per-request metadata and authentication state across Hono middleware boundaries.

**Secure rules**

**Rule 1: Store per-request metadata and authentication state strictly using `c.set()` and retrieve it via `c.get()` or `c.var` to keep request lifecycles strictly isolated.**

Use `c.set()` to attach request-scoped state during middleware execution and retrieve it via `c.get()` within route handlers. This prevents shared state from bleeding between concurrent requests and ensures proper isolation across asynchronous execution contexts.

```typescript
app.use('*', async (c, next) => {
  const user = await verifyAuthToken(c.req.header('Authorization'))
  c.set('user', user)
  await next()
})

app.get('/profile', (c) => {
  const user = c.get('user')
  return c.json({ userId: user.id })
})
```
