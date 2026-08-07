# Security cards

Repository: `https://github.com/feathersjs/feathers#v5.0.46`
Category: authentication

## authentication

### Enforce authentication and strategy registration using authentication hooks and services

**Use when**

When establishing identity verification, registering authentication strategies, and protecting service or route endpoints in a Feathers application.

**Secure rules**

**Rule 1: Use the authenticate hook or explicit service authentication to verify credentials and prevent unauthenticated access.**

Attach the `authenticate` hook on service methods or invoke `authService.authenticate()` explicitly to ensure requests carry validated credentials rather than unverified tokens.

```ts
import { hooks as authHooks } from '@feathersjs/authentication'

app.service('protected-service').hooks({
  before: {
    all: [authHooks.authenticate('jwt')]
  }
})
```

**Rule 2: Register required authentication strategies on the AuthenticationService instance.**

Register necessary strategies such as `jwt` and `local` on the `AuthenticationService` and mount it to handle authentication flows properly.

```ts
import { AuthenticationService, JWTStrategy } from '@feathersjs/authentication'
import { LocalStrategy } from '@feathersjs/authentication-local'
import type { Application } from './declarations'

declare module './declarations' {
  interface ServiceTypes {
    authentication: AuthenticationService
  }
}

export const authentication = (app: Application) => {
  const authentication = new AuthenticationService(app)

  authentication.register('jwt', new JWTStrategy())
  authentication.register('local', new LocalStrategy())

  app.use('authentication', authentication)
}
```

**Rule 3: Throw NotAuthenticated error on custom strategy authentication failures.**

Ensure custom authentication strategies throw a `NotAuthenticated` error instead of returning falsy values when token validation fails.

```ts
import { AuthenticationBaseStrategy } from '@feathersjs/authentication'
import { NotAuthenticated } from '@feathersjs/errors'

export class CustomStrategy extends AuthenticationBaseStrategy {
  async authenticate(authentication: any, params: any) {
    const { secretToken } = authentication
    const isValid = await this.validateToken(secretToken)

    if (!isValid) {
      throw new NotAuthenticated('Invalid authentication token')
    }

    return {
      authenticated: true,
      user: { id: 123 }
    }
  }
}
```
