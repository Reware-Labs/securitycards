# Security cards

Repository: `https://github.com/sveltejs/kit#@sveltejs/kit@2.70.1`

## Category: access control

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


## Category: api contract misuse

### Configure link preloading options correctly for sensitive routes

**Use when**

Developing SvelteKit pages with links that navigate to routes containing load functions or GET endpoints with side-effects.

**Secure rules**

**Rule 1: Explicitly configure link preloading attributes to prevent premature load function execution on hover.**

When a route contains load functions or GET endpoints that perform state mutations or side-effects, set the `data-sveltekit-preload-data` attribute to `false` or `tap` on anchor tags to prevent hover-triggered execution.

```html
<!-- Disable data preloading on routes with sensitive load functions -->
<a href="/dashboard/metrics" data-sveltekit-preload-data="false">
	View Metrics
</a>

<!-- Restrict preloading to explicit user touch/click events -->
<a href="/realtime-feed" data-sveltekit-preload-data="tap">
	View Live Feed
</a>
```


## Category: authentication

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


## Category: configuration source integrity

### Validate environment variable configuration schemas

**Use when**

When defining and validating environment variables at application build and startup time using `defineEnvVars`.

**Secure rules**

**Rule 1: Enforce strict schema validation on environment variables using Standard Schema validators within `defineEnvVars`.**

Apply strict schema validation on environment variables using Standard Schema validators like Valibot or Zod inside `defineEnvVars` imported from `@sveltejs/kit/env` to prevent untrusted or malformed configurations from altering security behavior.

```typescript
import { defineEnvVars } from '@sveltejs/kit/env';
import * as v from 'valibot';

export const variables = defineEnvVars({
	GOOGLE_ANALYTICS_ID: {
		public: true,
		schema: v.pipe(v.string(), v.regex(/^G-[A-Z0-9]+$/))
	}
});
```


## Category: cryptography

### Use Web Crypto API for secure random identifier generation

**Use when**

Generating secure tokens, identifiers, or random values in SvelteKit applications

**Secure rules**

**Rule 1: Use the standard global Web Crypto API for generating secure random identifiers instead of insecure pseudo-random generators**

Use `crypto.randomUUID()` when you need cryptographically secure random values or identifiers in your SvelteKit application. Avoid using `Math.random()` for security-sensitive operations because pseudo-random generators are predictable and expose the application to session hijacking, enumeration, or forgery attacks.

```javascript
const uniqueToken = crypto.randomUUID();
```


## Category: csrf

### Configure Application Origin for SvelteKit CSRF Protection

**Use when**

Configuring deployment environment variables or reverse proxy headers for production builds to ensure SvelteKit correctly validates the origin of incoming state-changing requests.

**Secure rules**

**Rule 1: Define the explicit deployment origin using the `ORIGIN` environment variable so SvelteKit can accurately validate request headers against cross-site submissions.**

Set the `ORIGIN` environment variable to your full application URL when starting the production build. If deploying behind a trusted reverse proxy, you can alternatively configure `PROTOCOL_HEADER` and `HOST_HEADER` variables, provided the proxy securely sanitizes incoming client headers.

```sh
ORIGIN=https://my.site node build

# Or behind a trusted reverse proxy:
PROTOCOL_HEADER=x-forwarded-proto HOST_HEADER=x-forwarded-host node build
```


## Category: file handling

### Configure Multipart Encoding and Validate File Uploads

**Use when**

Developing HTML forms or remote functions that accept file uploads to ensure binary payloads are correctly transmitted and validated.

**Secure rules**

**Rule 1: Explicitly set multipart encoding on forms containing file inputs and validate file fields on the server.**

Ensure that any HTML form handling file uploads includes `enctype="multipart/form-data"` to prevent the browser from silently dropping uploaded files during submission. Validate file inputs on the server using appropriate schema validators such as `v.file()`.

```svelte
<form method="POST" action="?/upload" enctype="multipart/form-data" use:enhance>
	<input type="file" name="document" />
	<button type="submit">Upload Document</button>
</form>
```


## Category: input contract definition

### Validate input structure, types, and values at route and function boundaries

**Use when**

Developing SvelteKit endpoints, remote functions, or dynamic routes that accept untrusted input parameters or request payloads.

**Secure rules**

**Rule 1: Validate remote function arguments using Standard Schema definitions**

Pass a Standard Schema validator as the first parameter to remote function initializers like `query` or `form` to enforce strict type constraints before execution on the server.

```js
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { query } from '$app/server';
import * as db from '$lib/server/database';

export const getPost = query(v.string(), async (slug) => {
	const [post] = await db.sql`
		SELECT * FROM post
		WHERE slug = ${slug}
	`;
	if (!post) error(404, 'Not found');
	return post;
});
```

**Rule 2: Validate route parameters using custom param matchers**

Create a parameter matcher in `src/params/` that checks incoming parameters against an explicit set or regular expression, then append the matcher name to the route folder to strictly constrain acceptable URL parameter formats.

```js
/// file: src/params/fruit.js
/**
 * @param {string} param
 * @return {param is ('apple' | 'orange')}
 * @satisfies {import('@sveltejs/kit').ParamMatcher}
 */
export function match(param) {
	return param === 'apple' || param === 'orange';
}
```


## Category: input driven boundary selection

### Restrict goto function usage to internal client side routes

**Use when**

When performing client-side navigation using SvelteKit's `goto(...)` function to ensure external URLs are not passed into the internal routing utility.

**Secure rules**

**Rule 1: Do not pass external or untrusted URLs into SvelteKit's goto navigation function.**

Use SvelteKit's `goto(...)` navigation function exclusively for internal app routes. For external URL navigation, use `window.location.href` with trusted destination targets.

```typescript
import { goto } from '$app/navigation';

// Internal route navigation:
await goto('/dashboard');

// External URL navigation:
window.location.href = trustedExternalUrl;
```


## Category: input interpretation safety

### Validate rest parameter paths before downstream usage

**Use when**

Processing captured route segment parameters in SvelteKit `load` functions or endpoint handlers

**Secure rules**

**Rule 1: Validate rest parameter values with a parameter matcher**

Check that a rest parameter contains an allowed value before using it. Define a matcher in `src/params` that returns `true` only for valid parameter strings, and attach that matcher to the rest parameter in the route name.

```js
/// file: src/params/file.js
/**
 * @param {string} param
 * @return {param is ('README.md' | 'docs/index.md')}
 * @satisfies {import('@sveltejs/kit').ParamMatcher}
 */
export function match(param) {
	return param === 'README.md' || param === 'docs/index.md';
}
```


## Category: interface protocol hardening

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


## Category: network boundary

### Prevent credential forwarding across untrusted network trust boundaries

**Use when**

Making server-side `fetch` requests inside load functions where automatic credential forwarding could leak authentication headers to external domains.

**Secure rules**

**Rule 1: Restrict cookie and authorization credential propagation to internal endpoints and trusted application subdomains**

SvelteKit automatically strips request `cookie` and `authorization` headers when fetching from external domains or non-subdomain origins to prevent credential leakage. Ensure that outbound requests to external services do not inadvertently expose credentials by relying on the built-in domain boundary isolation of the load `fetch` function.

```javascript
/** @type {import('./$types').PageLoad} */
export async function load({ fetch, params }) {
	const res = await fetch(`/api/items/${params.id}`);
	const item = await res.json();
	return { item };
}
```


## Category: resource exhaustion

### Enforce request body size limits to prevent server resource exhaustion

**Use when**

Configuring deployment adapters or building request handling hooks in SvelteKit to restrict incoming payload sizes.

**Secure rules**

**Rule 1: Maintain request body payload size limits via BODY_SIZE_LIMIT to avoid memory exhaustion from oversized requests.**

Use the built-in `BODY_SIZE_LIMIT` environment configuration to restrict oversized payloads. If disabling the built-in limit by setting it to `Infinity`, ensure custom body size checks are implemented inside a server handle hook.

```bash
BODY_SIZE_LIMIT=1M node build
```


## Category: runtime environment hardening

### Strip debug components from production builds using static environment flags

**Use when**

Developing and building SvelteKit applications that contain development-only debug overlays or diagnostic UI components which must be completely removed from production client bundles.

**Secure rules**

**Rule 1: Configure debug toggles as static public environment variables using defineEnvVars with static: true to enable compile-time dead-code elimination in production builds.**

Define debug flags in `src/env.ts` using `defineEnvVars` and set the `static` property to true alongside a schema validator. Ensure that production build processes set these variables to false or omit them so that conditional debug components are entirely stripped from the output bundle.

```ts
import { defineEnvVars } from '@sveltejs/kit/env';
import * as v from 'valibot';

export const variables = defineEnvVars({
	SHOW_DEBUG_OVERLAY: {
		public: true,
		static: true,
		schema: v.pipe(
			v.optional(v.string(), ''),
			v.transform((str) => str === 'true')
		)
	}
});
```


## Category: secret handling

### Protect Private Environment Variables and Credentials from Client Exposure

**Use when**

Developing server-side data loading, backend modules, form actions, or build configurations that manage sensitive tokens, API keys, and credentials in SvelteKit.

**Secure rules**

**Rule 1: Store secrets in server-only modules and import them exclusively using private environment modules.**

Keep sensitive environment variables private by default and store them in server-only locations such as `$lib/server` or private environment modules like `$env/static/private`. SvelteKit enforces compile-time checks to prevent these private modules from being bundled into client-side JavaScript.

```js
/// file: $lib/server/secrets.js
import { PRIVATE_API_KEY } from '$env/static/private';

export async function getSensitiveData() {
  // Server-only data fetching
}
```

**Rule 2: Exclude sensitive credentials and passwords when returning form action validation errors.**

Avoid returning sensitive input fields such as passwords or secrets in the object passed to SvelteKit's `fail()` function during form action error handling to prevent leaking credentials into browser HTML and client-side page state.

```js
/// file: src/routes/login/+page.server.js
import { fail } from '@sveltejs/kit';
import * as db from '$lib/server/db';

export const actions = {
	login: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');

		const user = await db.getUser(email);
		if (!user || user.password !== db.hash(password)) {
			return fail(400, { email, incorrect: true });
		}

		return { success: true };
	}
};
```

**Rule 3: Use high-entropy cryptographically secure secrets for ISR bypass tokens.**

Configure ISR revalidation bypass tokens using a high-entropy string accessed securely via static private environment variables to prevent unauthenticated external actors from forcing asset revalidation or causing serverless invocation abuse.

```js
/// file: +page.server.js
import { BYPASS_TOKEN } from '$env/static/private';

/** @type {import('@sveltejs/adapter-vercel').Config} */
export const config = {
	isr: {
		expiration: 300,
		bypassToken: BYPASS_TOKEN
	}
};
```


## Category: security control integrity

### Sanitize Error Responses and Ensure HandleError Fails Closed

**Use when**

Implementing custom error handling hooks in `src/hooks.server.js` to process server exceptions securely without leaking internal details.

**Secure rules**

**Rule 1: Sanitize internal error details and ensure `handleError` never throws unhandled exceptions.**

Always log full exception details securely on the server and return a sanitized error object containing a generic message or tracking ID to the client. Ensure the hook itself does not throw, preserving framework exception handling and failing closed.

```js
/// file: src/hooks.server.js
/** @type {import('@sveltejs/kit').HandleServerError} */
export async function handleError({ error, event, status, message }) {
	const errorId = crypto.randomUUID();

	// Log full error details securely on the server
	console.error(`[${errorId}]`, error);

	// Return non-sensitive error response to client
	return {
		message: 'An unexpected error occurred.',
		errorId
	};
}
```


## Category: session management

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
