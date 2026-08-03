# Security cards

Repository: `https://github.com/sveltejs/kit#@sveltejs/kit@2.70.1`
Category: input contract definition

## input contract definition

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
