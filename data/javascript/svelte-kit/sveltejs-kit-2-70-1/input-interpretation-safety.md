# Security cards

Repository: `https://github.com/sveltejs/kit#@sveltejs/kit@2.70.1`
Category: input interpretation safety

## input interpretation safety

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
