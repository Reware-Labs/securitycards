# Security cards

Repository: `https://github.com/feathersjs/feathers#v5.0.46`
Category: cryptography

## cryptography

### Hash user passwords securely before database persistence

**Use when**

When defining data resolvers to prepare user credentials before saving them to the database in a Feathers application.

**Secure rules**

**Rule 1: Use the passwordHash property resolver utility for one-way password hashing.**

Always hash plain text passwords using the `passwordHash` property resolver utility from `@feathersjs/authentication-local` within data resolvers to safely perform one-way Bcrypt hashing before saving passwords to the database.

```typescript
import { resolve } from '@feathersjs/schema'
import { passwordHash } from '@feathersjs/authentication-local'

export const userDataResolver = resolve<User, HookContext>({
  properties: {
    password: passwordHash({ strategy: 'local' })
  }
})
```
