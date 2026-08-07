# Security cards

Repository: `https://github.com/adonisjs/core#v7.3.5`
Documentation repository: `https://github.com/adonisjs/v7-docs#main`
Category: input interpretation safety

## input interpretation safety

### Safely Decode and Handle Incoming Verification Tokens

**Use when**

Parsing and processing incoming user verification tokens in request handlers.

**Secure rules**

**Rule 1: Always use VerificationToken.decode() and explicitly handle null return values to prevent inconsistent parsing bugs and token verification bypasses.**

When decoding incoming verification tokens, developers must use `VerificationToken.decode()` and handle `null` return values. The decoder strictly validates base64 URL encoding and structure, returning `null` for malformed, empty, or incomplete tokens without throwing unhandled exceptions.

```typescript
const tokenString = request.input('token')
const decoded = VerificationToken.decode(tokenString)

if (!decoded) {
  return response.badRequest('Invalid token format')
}
```
