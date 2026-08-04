# Security cards

Repository: `https://github.com/sveltejs/kit#@sveltejs/kit@2.70.1`
Category: api contract misuse

## api contract misuse

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
