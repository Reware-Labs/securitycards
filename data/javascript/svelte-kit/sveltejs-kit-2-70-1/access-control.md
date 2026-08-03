# Security cards

Repository: `https://github.com/sveltejs/kit#@sveltejs/kit@2.70.1`
Category: access control

## access control

### Enforce Server-Side Authorization Checks in SvelteKit Server Handlers

**Use when**

Implementing server load functions, remote function handlers, or routes that handle sensitive user data and require access control verification.

**Secure rules**

**Rule 1: Check authentication and authorization inside server load functions before returning protected data**

In `+page.server.js` or `+layout.server.js`, verify server-side session and permission information from `locals` before returning protected data. Use `redirect(...)` when an unauthenticated user must sign in, and use `error(...)` when the user does not have permission to access the resource.

```js
import { error, redirect } from '@sveltejs/kit';

/** @type {import('./$types').LayoutServerLoad} */
export function load({ locals }) {
	if (!locals.user) {
		redirect(307, '/login');
	}

	if (!locals.user.isAdmin) {
		error(403, 'Forbidden');
	}

	return {
		user: locals.user
	};
}
```
