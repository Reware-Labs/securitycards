# Security cards

Repository: `https://github.com/honojs/hono#v4.12.32`
Category: file handling

## file handling

### Prevent Path Traversal When Serving Static Files and Generating Static Sites

**Use when**

When configuring static file serving middleware or static site generation helpers to prevent unauthorized access and protect target output directories.

**Secure rules**

**Rule 1: Configure static file middleware using explicit root directories and manifests to prevent directory traversal.**

Ensure that `serveStatic` utilizes explicit root paths and includes the required manifest option when running on adapters like Cloudflare Workers to guarantee proper containment and file resolution.

```typescript
import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import manifest from '__STATIC_CONTENT_MANIFEST'

const app = new Hono()

app.use('/static/*', serveStatic({ root: './assets', manifest }))

export default app
```

**Rule 2: Validate static site generation routes and output destinations to prevent path traversal.**

Rely on built-in path validation mechanisms such as `toSSG`'s destination checks and sanitize any untrusted parameters used in route paths to ensure files remain bounded within expected target directories.

```typescript
import { Hono } from 'hono'
import { toSSG, ssgParams } from 'hono/ssg'
import fs from 'node:fs/promises'

const app = new Hono()
app.get('/posts/:id', ssgParams([{ id: 'first-post' }, { id: 'second-post' }]), (c) => {
  return c.html(`<h1>Post ${c.req.param('id')}</h1>`)
})

await toSSG(app, fs, { dir: './static' })
```


### Validate and constrain multipart form file uploads

**Use when**

Handling incoming file uploads and multipart/form-data payloads via `validator('form', ...)` or `parseBody()`.

**Secure rules**

**Rule 1: Limit multipart request bodies and verify uploaded file fields**

Apply Hono's `bodyLimit` middleware before the upload handler to reject request bodies larger than the configured `maxSize`. Parse multipart form data with `c.req.parseBody()` and verify that the expected upload field is a `File`. Before writing an uploaded file to storage or forwarding it to another service, validate that the expected fields exist and check metadata such as filename, MIME type, and size.

```ts
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'

const app = new Hono()

app.post(
  '/upload',
  bodyLimit({
    maxSize: 5 * 1024 * 1024, // 5 MiB
    onError: (c) => {
      return c.text('File too large', 413)
    },
  }),
  async (c) => {
    const body = await c.req.parseBody()
    const file = body['file']

    if (!(file instanceof File)) {
      return c.text('File is required', 400)
    }

    return c.text(`Uploaded ${file.name}`)
  }
)
```
