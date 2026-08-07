# Security cards

Repository: `https://github.com/adonisjs/core#v7.3.5`
Documentation repository: `https://github.com/adonisjs/v7-docs#main`
Category: access control

## access control

### Enforce Authorization Checks and Bouncer Policies on Protected Resources

**Use when**

When implementing controller actions, route handlers, or middleware that handle sensitive data mutations, access control, or resource retrieval.

**Secure rules**

**Rule 1: Explicitly authorize user actions using Bouncer methods before executing sensitive operations.**

Always call bouncer methods such as bouncer.authorize() or bouncer.with().authorize() within your controller actions to enforce ownership and permission boundaries and prevent insecure direct object references.

```typescript
import Post from '#models/post'
import PostPolicy from '#policies/post_policy'
import type { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  async delete({ bouncer, params, response }: HttpContext) {
    const post = await Post.findOrFail(params.id)
    await bouncer.with(PostPolicy).authorize('delete', post)
    await post.delete()
    return { message: 'Post deleted successfully' }
  }
}
```

**Rule 2: Terminate the middleware request pipeline immediately when authorization checks fail**

When writing custom authorization middleware, return an explicit error response or throw an exception upon authorization failure, and never invoke await next() when checks fail.

```typescript
export default class AuthorizeRequestMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn, options: { role: string }) {
    const user = auth.getUserOrFail()
    if (user.role !== options.role) {
      return response.unauthorized('Not authorized to access this route')
    }
    await next()
  }
}
```


### Restrict Granular Token Abilities and Channel Access Control

**Use when**

When issuing API access tokens, defining token capabilities, or authorizing real-time Server-Sent Event channels.

**Secure rules**

**Rule 1: Assign granular abilities to API tokens rather than wildcard permissions.**

Specify explicit permission strings when creating user access tokens and enforce those abilities within your route handlers using token.allows() to follow the principle of least privilege.

```typescript
// Creating token with limited capabilities
const token = await User.accessTokens.create(user, ['projects:read'])

// Checking abilities on protected routes
router.delete('/projects/:id', async ({ auth, response }) => {
  if (!auth.user!.currentAccessToken.allows('projects:delete')) {
    return response.forbidden('Token lacks projects:delete ability')
  }
  // Proceed with deletion...
}).use(middleware.auth({ guards: ['api'] }))
```

**Rule 2: Explicitly authorize sensitive Server-Sent Event channels.**

Register authorization callbacks using transmit.authorize() to ensure that unauthenticated or unauthorized clients cannot subscribe to private real-time channels.

```typescript
import transmit from '@adonisjs/transmit/services/main'
import Chat from '#models/chat'

transmit.authorize<{ chatId: string }>(
  'chats/:chatId/messages',
  async (ctx, { chatId }) => {
    const chat = await Chat.findOrFail(+chatId)
    return ctx.bouncer.allows('accessChat', chat)
  }
)
```
