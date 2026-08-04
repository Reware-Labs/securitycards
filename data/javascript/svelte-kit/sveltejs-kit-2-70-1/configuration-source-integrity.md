# Security cards

Repository: `https://github.com/sveltejs/kit#@sveltejs/kit@2.70.1`
Category: configuration source integrity

## configuration source integrity

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
