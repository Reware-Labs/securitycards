# Security cards

Repository: `https://github.com/sveltejs/kit#@sveltejs/kit@2.70.1`
Category: input driven boundary selection

## input driven boundary selection

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
