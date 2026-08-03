# Security cards

Repository: `https://github.com/honojs/hono#v4.12.32`
Category: resource exhaustion

## resource exhaustion

### Enforce Body Size Limits to Prevent Excessive Memory Consumption

**Use when**

Handling incoming HTTP requests and processing request bodies in Hono applications, particularly when deployed on serverless environments like AWS Lambda.

**Secure rules**

**Rule 1: Apply the bodyLimit middleware to restrict payload size independently of client-supplied Content-Length headers.**

Use the `bodyLimit` middleware from `hono/body-limit` to enforce request size boundaries. This ensures payload restrictions are enforced directly against the actual payload body size, preventing attackers from bypassing limits with forged or understated `Content-Length` headers and mitigating denial-of-service risks caused by excessive memory usage.

```typescript
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { handle } from 'hono/aws-lambda'

const app = new Hono()

app.post(
  '/upload',
  bodyLimit({
    maxSize: 1024 * 1024,
    onError: (c) => c.text('Payload Too Large', 413)
  }),
  async (c) => {
    const body = await c.req.text()
    return c.json({ length: body.length })
  }
)

export const handler = handle(app)
```
