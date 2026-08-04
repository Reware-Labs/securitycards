# Security cards

Repository: `https://github.com/honojs/hono#v4.12.32`
Category: configuration source integrity

## configuration source integrity

### Import Hono from trusted registry sources

**Use when**

Importing Hono modules into Deno runtimes for application development.

**Secure rules**

**Rule 1: Import Hono from trusted, authenticated configuration and package registries such as JSR.**

When configuring Deno applications to use Hono, import the package from the official JSR registry (`jsr:@hono/hono`) to ensure the application receives verified maintenance releases, security updates, and context-isolation patches.

```typescript
import { Hono } from 'jsr:@hono/hono'

const app = new Hono()

app.get('/', (c) => c.text('Hello Deno!'))

export default app
```
