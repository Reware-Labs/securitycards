# Security cards

Repository: `https://github.com/sveltejs/kit#@sveltejs/kit@2.70.1`
Category: authentication

## authentication

### Validate Authentication Sessions and Populate Locals in Server Hooks

**Use when**

Verifying user authentication state and credentials inside server hooks before handling downstream request paths.

**Secure rules**

**Rule 1: Inspect authentication tokens or cookies inside server hooks to establish user identity and populate event locals securely.**

Use `src/hooks.server.js` to inspect authentication cookies and validate sessions before attaching the identity context to `event.locals`. This guarantees that downstream request handlers rely on verified server-side session state rather than unverified client requests.

```javascript
export async function handle({ event, resolve }) {
  const sessionId = event.cookies.get('session');
  if (sessionId) {
    const user = await validateSession(sessionId);
    if (user) {
      event.locals.user = user;
    }
  }
  return resolve(event);
}
```
