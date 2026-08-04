# Security cards

Repository: `https://github.com/sveltejs/kit#@sveltejs/kit@2.70.1`
Category: network boundary

## network boundary

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
