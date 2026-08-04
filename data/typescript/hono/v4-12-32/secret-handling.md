# Security cards

Repository: `https://github.com/honojs/hono#v4.12.32`
Category: secret handling

## secret handling

### Load application secrets securely from environment bindings or providers

**Use when**

When configuring authentication, environment variables, or platform secrets in Hono applications.

**Secure rules**

**Rule 1: Avoid hardcoding plaintext credentials and secrets in source code**

Do not include plaintext credentials or static secrets directly in source code or parameter definitions. Load them securely from environment variables using `env` from `hono/adapter`, or access secrets dynamically through the deployment platform.

```typescript
import { Hono } from 'hono'
import { env } from 'hono/adapter'
import { basicAuth } from 'hono/basic-auth'

type AuthEnv = {
  ADMIN_USER: string
  ADMIN_PASS: string
}

const app = new Hono()

app.use('/admin/*', (c, next) => {
  const { ADMIN_USER, ADMIN_PASS } = env<AuthEnv>(c)

  if (!ADMIN_USER || !ADMIN_PASS) {
    throw new Error('Admin credentials are not configured')
  }

  return basicAuth({
    username: ADMIN_USER,
    password: ADMIN_PASS,
  })(c, next)
})
```

**Rule 2: Access runtime environment bindings and secrets through request context env.**

Retrieve environment variables, platform secrets, and database bindings strictly via `c.env` on the request context rather than referencing global or module-scoped variables to prevent cross-request leakage.

```typescript
app.get('/secure-data', async (c) => {
  const secretKey = c.env.API_SECRET_KEY
  if (!secretKey) {
    return c.text('Configuration error', 500)
  }
  const data = await fetchExternalData(secretKey)
  return c.json(data)
})
```
