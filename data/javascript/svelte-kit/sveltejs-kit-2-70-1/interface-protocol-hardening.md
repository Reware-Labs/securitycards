# Security cards

Repository: `https://github.com/sveltejs/kit#@sveltejs/kit@2.70.1`
Category: interface protocol hardening

## interface protocol hardening

### Configure HTTP Security and CORS Headers Safely Across Routes and Hooks

**Use when**

Setting up HTTP security headers, response modifications, and CORS policies during server-side rendering, request handling, or API route definitions.

**Secure rules**

**Rule 1: Set cache and security headers in load functions without duplicating header keys or attempting to set cookies.**

Use the `setHeaders` helper within server and universal load functions to configure response headers once per route hierarchy. Ensure you do not set `set-cookie` headers through `setHeaders` and avoid duplicate conflicting header keys across nested layouts.

```js
/** @type {import('./$types').PageLoad} */
export async function load({ setHeaders }) {
	setHeaders({
		'cache-control': 'private, no-cache, no-store, must-revalidate'
	});
}
```

**Rule 2: Clone and reconstruct immutable responses when attaching security headers in server hooks.**

In `src/hooks.server.js`, wrap response headers using `new Headers(response.headers)` before modifying them. Construct a new `Response` object to prevent `TypeError` exceptions when handling immutable responses like redirects.

```js
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const response = await resolve(event);

	const headers = new Headers(response.headers);
	headers.set('X-Content-Type-Options', 'nosniff');
	headers.set('X-Frame-Options', 'DENY');

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}
```

**Rule 3: Add CORS headers explicitly to production OPTIONS handlers**

When creating an `OPTIONS` handler, explicitly add the required `Access-Control-Allow-Origin` and `Access-Control-Allow-Methods` response headers. Vite injects these headers during development, but they are not present in production unless you add them.
