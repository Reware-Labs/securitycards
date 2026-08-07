# Security cards

Repository: `https://github.com/adonisjs/core#v7.3.5`
Documentation repository: `https://github.com/adonisjs/v7-docs#main`
Category: authentication

## authentication

### Verify User Credentials and Enforce Token Expiration

**Use when**

Verifying user credentials during authentication or validating token-based and verification tokens.

**Secure rules**

**Rule 1: Use secure password verification methods and ensure tokens enforce expiration limits.**

Apply the withAuthFinder mixin to Lucid models and use User.verifyCredentials to prevent timing attacks, and always configure explicit expiration times using the expiresIn option when issuing access tokens.

```typescript
static accessTokens = DbAccessTokensProvider.forModel(User, {
  expiresIn: '30 days',
  prefix: 'oat_',
  table: 'auth_access_tokens',
  type: 'auth_token',
  tokenSecretLength: 40,
})
```

**Rule 2: Validate token signatures, payload structure, and expiration timestamps before granting authentication.**

Verify token signatures, validate the payload structure, check token expiration using token.isExpired(), and verify that the user retrieved from the token payload still exists in the backing store.

```typescript
const decoded = UserVerificationToken.decode(userProvidedToken)
if (!decoded) {
  return response.badRequest('Invalid token format')
}

const token = await UserVerificationToken.find(decoded.identifier)
if (!token || token.isExpired() || !token.verify(decoded.secret)) {
  return response.unauthorized('Token is invalid or has expired')
}
```
