# Security cards

Repository: `https://github.com/adonisjs/core#v7.3.5`
Documentation repository: `https://github.com/adonisjs/v7-docs#main`
Category: boundary control

## boundary control

### Validate incoming request payloads at controller entry

**Use when**

Processing incoming HTTP request data inside controllers before executing core business logic.

**Secure rules**

**Rule 1: Validate all incoming request data using `request.validateUsing()` before executing any business logic.**

Always validate request parameters through `request.validateUsing()` using a defined validator to establish a clear trust boundary at the controller entry point. Operate exclusively on the returned validated payload rather than trusting raw request inputs.

```typescript
import { createPostValidator } from '#validators/post'
import type { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  async store({ request }: HttpContext) {
    const payload = await request.validateUsing(createPostValidator)
    // Process strictly using validated payload
  }
}
```
