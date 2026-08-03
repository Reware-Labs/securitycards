# Security cards

Repository: `https://github.com/sveltejs/kit#@sveltejs/kit@2.70.1`
Category: session management

## session management

### Set secure cookie attributes and explicitly rotate or clear sessions

**Use when**

Managing authenticated user sessions, setting session cookies, or handling user logout and revocation.

**Secure rules**

**Rule 1: Always specify explicit path options and security attributes when setting session cookies.**

When creating or deleting session identifiers using `cookies.set()`, `cookies.delete()`, or `cookies.serialize()`, explicitly define options such as `path: '/'`, `httpOnly: true`, and `secure: true` to prevent fallback issues and token leakage.

```javascript
export function load({ cookies }) {
  cookies.set('session', token, { path: '/', httpOnly: true, secure: true });
  return {};
}
```

**Rule 2: Explicitly invalidate session state and event locals upon logout.**

When a user logs out inside server actions, clear the session cookie using `cookies.delete()` and explicitly reset authorization states like `event.locals.user` to ensure dependent load functions do not retain stale session context.

```javascript
export const actions = {
	logout: async (event) => {
		event.cookies.delete('sessionid', { path: '/' });
		event.locals.user = null;
	}
};
```
