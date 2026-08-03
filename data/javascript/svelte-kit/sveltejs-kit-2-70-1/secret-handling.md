# Security cards

Repository: `https://github.com/sveltejs/kit#@sveltejs/kit@2.70.1`
Category: secret handling

## secret handling

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
