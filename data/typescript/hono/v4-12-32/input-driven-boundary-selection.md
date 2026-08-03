# Security cards

Repository: `https://github.com/honojs/hono#v4.12.32`
Category: input driven boundary selection

## input driven boundary selection

### Configure static route paths and routing security controls upfront

**Use when**

Developing Hono applications that require secure routing boundaries, wildcard middleware paths, and sub-applications.

**Secure rules**

**Rule 1: Use route path introspection helpers and pattern constraints for route-level security controls.**

Inspect canonical route patterns using `routePath(c)` or `matchedRoutes(c)` from `hono/route` rather than raw paths, and apply explicit parameter regexes and strict path handling.

```typescript
import { Hono } from 'hono'
import { routePath } from 'hono/route'

const app = new Hono({ strict: true })

app.use('*', async (c, next) => {
  const pattern = routePath(c)
  if (pattern.startsWith('/admin') && !c.req.header('Authorization')) {
    return c.text('Unauthorized', 401)
  }
  await next()
})

app.get('/admin/:id{\d+}', (c) => c.text('Admin Section'))
```
