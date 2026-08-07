# Security cards

Repository: `https://github.com/adonisjs/core#v7.3.5`
Documentation repository: `https://github.com/adonisjs/v7-docs#main`
Category: input contract definition

## input contract definition

### Validate incoming request data using VineJS schemas in AdonisJS controllers

**Use when**

Use when validating incoming request bodies, query parameters, or headers against strict schemas before processing data in controller actions.

**Secure rules**

**Rule 1: Validate all incoming request payloads against explicit VineJS schemas using request.validateUsing()**

Pass your compiled VineJS validation schema to `request.validateUsing()` inside your controller actions to reject malformed or unvalidated input before application logic processing.

```typescript
import type { HttpContext } from '@adonisjs/core/http'
import { createPostValidator } from '#validators/post'

export default class PostsController {
  async store({ request }: HttpContext) {
    const payload = await request.validateUsing(createPostValidator)
    const post = await Post.create(payload)
    return post
  }
}
```
