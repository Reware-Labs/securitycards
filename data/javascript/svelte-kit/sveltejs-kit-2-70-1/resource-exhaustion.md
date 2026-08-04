# Security cards

Repository: `https://github.com/sveltejs/kit#@sveltejs/kit@2.70.1`
Category: resource exhaustion

## resource exhaustion

### Enforce request body size limits to prevent server resource exhaustion

**Use when**

Configuring deployment adapters or building request handling hooks in SvelteKit to restrict incoming payload sizes.

**Secure rules**

**Rule 1: Maintain request body payload size limits via BODY_SIZE_LIMIT to avoid memory exhaustion from oversized requests.**

Use the built-in `BODY_SIZE_LIMIT` environment configuration to restrict oversized payloads. If disabling the built-in limit by setting it to `Infinity`, ensure custom body size checks are implemented inside a server handle hook.

```bash
BODY_SIZE_LIMIT=1M node build
```
