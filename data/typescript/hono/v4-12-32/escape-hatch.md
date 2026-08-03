# Security cards

Repository: `https://github.com/honojs/hono#v4.12.32`
Category: escape hatch

## escape hatch

### Sanitize and isolate untrusted content used in dangerouslySetInnerHTML

**Use when**

Rendering dynamic or user-provided HTML content via `dangerouslySetInnerHTML` in Hono JSX components.

**Secure rules**

**Rule 1: Keep untrusted strings in escaped Hono interpolation instead of raw HTML APIs**

Hono escapes string values interpolated normally into an `html` tagged template. Raw HTML paths such as `raw()` and `dangerouslySetInnerHTML` bypass normal escaping, so do not pass request parameters or other untrusted strings through them. Keep such values as ordinary template interpolations.

```typescript
import { Hono } from 'hono'
import { html } from 'hono/html'

const app = new Hono()

app.get('/:username', (c) => {
  const { username } = c.req.param()
  return c.html(
    html`<!doctype html>
      <h1>Hello! ${username}!</h1>`
  )
})

export default app
```
