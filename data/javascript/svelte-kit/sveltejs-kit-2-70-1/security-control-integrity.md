# Security cards

Repository: `https://github.com/sveltejs/kit#@sveltejs/kit@2.70.1`
Category: security control integrity

## security control integrity

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
