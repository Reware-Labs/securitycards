# Security cards

Repository: `https://github.com/adonisjs/core#v7.3.5`
Documentation repository: `https://github.com/adonisjs/v7-docs#main`
Category: security control integrity

## security control integrity

### Prevent Authorization Policy Bypass by Returning Undefined

**Use when**

Developing policy classes with `before()` hooks to control access to specific authorization actions in AdonisJS.

**Secure rules**

**Rule 1: Ensure policy before hooks return undefined to fall back to specific action methods unless overriding globally.**

When implementing a `before()` hook in a policy class, only return an explicit boolean value if you intend to completely short-circuit and bypass all other authorization rules. For standard access control flows where specific method rules must execute, make sure the `before()` hook returns `undefined` by default so execution proceeds correctly to the targeted action methods.

```typescript
import User from '#models/user'
import Post from '#models/post'
import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class PostPolicy extends BasePolicy {
  before(user: User | null, action: string, ...params: any[]) {
    if (user && user.role === 'admin') {
      return true
    }
  }

  edit(user: User, post: Post): AuthorizerResponse {
    return user.id === post.userId
  }
}
```
