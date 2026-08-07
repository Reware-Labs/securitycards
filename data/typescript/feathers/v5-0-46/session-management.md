# Security cards

Repository: `https://github.com/feathersjs/feathers#v5.0.46`
Category: session management

## session management

### Invalidate Authentication Tokens Server-Side Upon Logout

**Use when**

Implementing logout functionality or managing server-side session and token invalidation in Feathers applications.

**Secure rules**

**Rule 1: Extend AuthenticationService to track and reject revoked tokens on the server.**

By default, valid JWTs remain usable until their expiration time. To ensure proper logout invalidation, extend `AuthenticationService` to store revoked access tokens in a shared store such as Redis and check token validity during `verifyAccessToken` and `remove` requests.

```js
const redis = require('redis');
const { AuthenticationService } = require('@feathersjs/authentication');
const { NotAuthenticated } = require('@feathersjs/errors');

class RedisAuthService extends AuthenticationService {
  constructor (app, configKey) {
    super(app, configKey);
    const client = redis.createClient();
    this.redis = client;
    (async () => {
      await this.redis.connect();
    })();
  }

  async revokeAccessToken (accessToken) {
    const verified = await this.verifyAccessToken(accessToken);
    const expiry = verified.exp - Math.floor(Date.now() / 1000);
    if (expiry > 0) {
      await this.redis.set(accessToken, '1', { EX: expiry });
    }
    return verified;
  }

  async verifyAccessToken (accessToken) {
    if (await this.redis.exists(accessToken)) {
      throw new NotAuthenticated('Token revoked');
    }
    return super.verifyAccessToken(accessToken);
  }

  async remove (id, params) {
    const authResult = await super.remove(id, params);
    const { accessToken } = authResult;
    if (accessToken) {
      await this.revokeAccessToken(accessToken);
    }
    return authResult;
  }
}

app.use('/authentication', new RedisAuthService(app));
```

**Rule 2: Invoke app.logout() on the client to clear local credentials and invoke server removal.**

When ending a user session, always call `app.logout()` instead of manually clearing local storage keys. This ensures the access token is removed from client storage and the `remove` method is invoked on the server authentication service.

```ts
async function handleUserLogout(app: any) {
  try {
    await app.logout()
    showLoginPage()
  } catch (error) {
    console.error('Logout failed', error)
  }
}
```
