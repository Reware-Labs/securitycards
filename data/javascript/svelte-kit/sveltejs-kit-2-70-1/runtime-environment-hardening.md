# Security cards

Repository: `https://github.com/sveltejs/kit#@sveltejs/kit@2.70.1`
Category: runtime environment hardening

## runtime environment hardening

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
