# Security blueprint

Repository: `https://github.com/vuejs/core#v3.5.40`

## Security posture

The Vue security model relies on framework-enforced output encoding and state boundaries, while requiring developers to actively manage raw HTML, dynamic URL schemes, and template execution. The framework protects applications against default text-based XSS through standard template interpolations, but leaves developers responsible for validating and sanitizing untrusted inputs passed to directives like `v-html` and dynamic attributes like `:href`. Security-sensitive surfaces include component props, event payloads, dependency bundling configurations, and browser storage persistence, which must fail closed when encountering malformed or unverified data.

## Essential implementation rules

1. **Keep computed getters pure and avoid direct mutation of derived states**

Computed getter functions should never mutate reactive state, perform asynchronous operations, or manipulate the DOM, and their return values must be treated as immutable snapshots. Handle side-effecting work in a `watch()` callback or appropriate lifecycle hook instead.

2. **Enforce prop immutability and validate component boundaries**

Treat received props as read-only by avoiding direct mutations or modifications of nested fields, and use custom events carrying updated data for parent-managed state changes. Use object-syntax `defineProps()` and explicit payload validation before calling `emit()` to reject malformed input.

3. **Disable production devtools and development debugging flags**

Configure release builds to explicitly set `__VUE_PROD_DEVTOOLS__` to `'false'`, disable source maps, and define `process.env.NODE_ENV` as `production` to strip devtools hooks, debugging warnings, and internal state inspection capabilities.

4. **Externalize library dependencies and peer dependencies**

Configure bundler externalization options to include every package listed in `dependencies` and `peerDependencies` when shipping a Vue plugin or component library to prevent unintended inlining.

5. **Prevent untrusted template execution and raw HTML rendering**

Never pass untrusted user input directly as Vue component template strings or unsanitized dynamic user content to the `v-html` directive or `innerHTML` properties. Use standard template interpolation via `{{ }}` for safe text rendering.

6. **Bind dynamic styles using secure object syntax**

Restrict dynamic style inputs to explicit allowed properties using object syntax bindings instead of allowing user-controlled CSS strings or raw style tags.

7. **Sanitize dynamic URL schemes in attribute bindings**

Validate and sanitize dynamically bound URLs before passing them to template attributes such as `:href` to prevent unsafe URL schemes like `javascript:` from executing scripts.

8. **Prevent reactivity overhead on large datasets with shallowRef**

Opt out of deep reactivity proxy wrapping by using `shallowRef()` for massive immutable or infrequently mutated datasets to prevent CPU and memory exhaustion.

9. **Validate and sanitize persisted browser storage state**

Treat values restored from browser storage or URL fragments as untrusted input by parsing them inside a `try...catch`, verifying runtime types, and copying only explicitly allowed options into a new object before applying state.

10. **Protect provided reactive state using readonly wrappers**

Wrap reactive state exposed through `provide()` with `readonly()` to prevent unauthorized or untracked state mutations by descendant injector components, exposing dedicated update functions for controlled modifications.
