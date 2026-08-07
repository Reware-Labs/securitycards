# Security cards

Repository: `https://github.com/adonisjs/core#v7.3.5`
Documentation repository: `https://github.com/adonisjs/v7-docs#main`
Category: file handling

## file handling

### Validate paths and enforce size, extension, and uniqueness constraints on file uploads

**Use when**

When handling user-uploaded files, defining storage paths, or serving file downloads to prevent path traversal and resource exhaustion.

**Secure rules**

**Rule 1: Validate route parameters and construct file paths securely using app.makePath() when serving downloads.**

Ensure file paths are constructed securely using `app.makePath()` and validate input parameters to prevent path traversal attacks when serving file downloads using `response.download()` or `response.attachment()`.

```typescript
import app from '@adonisjs/core/services/app'
import type { HttpContext } from '@adonisjs/core/http'

export default class InvoicesController {
  async download({ response, params }: HttpContext) {
    const filePath = app.makePath(`storage/invoices/${params.id}.pdf`)
    response.download(filePath)
  }
}
```

**Rule 2: Enforce explicit size limits and allowed extension constraints on uploads**

Enforce explicit file size limits and allowed extension constraints when handling user uploads via `request.file()` or validator schemas to protect against resource exhaustion or arbitrary file execution.

```typescript
import router from '@adonisjs/core/services/router'

router.post('/avatar', ({ request }) => {
  const avatar = request.file('avatar', {
    size: '2mb',
    extnames: ['jpg', 'png', 'jpeg']
  })
  if (!avatar || !avatar.isValid) {
    return avatar?.errors
  }
})
```

**Rule 3: Generate unique random filenames and store relative keys safely.**

Generate unique, random filenames such as UUIDs via `string.uuid()` when saving user-uploaded files using `moveToDisk` and store only the relative file key in the database rather than untrusted user filenames.

```typescript
const key = `${string.uuid()}.${avatar.extname ?? 'txt'}`
await avatar.moveToDisk(key)
user.avatar = key
await user.save()
```
