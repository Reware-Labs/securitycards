# Security cards

Repository: `https://github.com/vuejs/core#v3.5.40`
Documentation repository: `https://github.com/vuejs/docs#main`

## Category: api contract misuse

### Keep computed getters pure and avoid direct mutation of derived states

**Use when**

Developing computed properties for derived state in Vue components.

**Secure rules**

**Rule 1: Keep computed getter functions side-effect free and pure**

Computed getters should never mutate reactive state, perform asynchronous operations, or manipulate the DOM. Handle any side-effecting work in a `watch()` callback or another appropriate lifecycle hook instead.

```vue
<script setup>
import { ref, computed, watch } from 'vue'

const count = ref(0)

/* Pure computed — derives data only */
const doubleCount = computed(() => count.value * 2)

/* Side-effects belong in a watcher */
watch(count, async (newVal) => {
  // Safe: perform async work when count changes
  await fetch(`/api/items/${newVal}`)
})
</script>
```

**Rule 2: Treat computed return values as immutable snapshots**

Never mutate the value returned by a computed property. If updates are required, either change the underlying reactive state or create a writable computed property that defines an explicit `set` function.

```vue
<script setup>
import { ref, computed } from 'vue'

const firstName = ref('Jane')
const lastName  = ref('Doe')

/* Writable computed with getter and setter */
const fullName = computed({
  get() {
    return `${firstName.value} ${lastName.value}`
  },
  set(newVal) {
    ;[firstName.value, lastName.value] = newVal.split(' ')
  }
})

/* Avoid: mutating the computed snapshot directly */
// fullName.value = 'Will throw a warning unless a setter is provided'
</script>
```


## Category: boundary control

### Emit events and clone state updates instead of mutating props directly

**Use when**

When updating component data or passing state modifications from a child component back up to a parent component across the component state boundary.

**Secure rules**

**Rule 1: Keep props immutable and use custom events for updates**

Props received by a child component are read-only. Avoid mutating them or any of their nested fields. Instead, emit a custom event carrying the updated data so the parent (the prop owner) performs the state change.

```vue
<script setup lang="ts">
const props = defineProps<{ user: { name: string } }>()
const emit  = defineEmits<{ (e: 'update-user', value: { name: string }): void }>()

function handleNameChange(newName: string) {
  // do NOT mutate props.user directly
  emit('update-user', { ...props.user, name: newName })
}
</script>
```


## Category: configuration source integrity

### Secure Development Tooling and Production Build Flags in Vue

**Use when**

Configuring production bundlers and build workflows for Vue applications to prevent exposing development tooling, internal devtools hooks, or raw source maps.

**Secure rules**

**Rule 1: Disable Vue Devtools support and production source maps**

In release builds, compile Vue with **`__VUE_PROD_DEVTOOLS__` set to `'false'`** and turn **`build.sourcemap` off** so that devtools hooks and source maps are excluded from the production bundle.

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  define: {
    // Prevent devtools code from being included in production
    __VUE_PROD_DEVTOOLS__: 'false'
  },
  build: {
    // Do not emit source-map files in the production output
    sourcemap: false
  }
})
```


### Validate Dependency Versions and Externalize Third-Party Modules in Package Configurations

**Use when**

Building scripts, project generators, or bundler configurations that handle third-party dependencies and package manifests.

**Secure rules**

**Rule 1: Externalize library dependencies and peerDependencies when bundling**

When you ship a Vue plugin or component library, configure the bundler’s `external` option with every package listed in `dependencies` and `peerDependencies`.

```js
// build.mjs (esbuild example)
import { build } from 'esbuild'
import pkg from './package.json' assert { type: 'json' }

const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {})
]

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/my-lib.js',
  format: 'esm',
  bundle: true,
  external                 // don't inline external packages
})
```


## Category: dangerous execution

### Prevent Untrusted Template Execution

**Use when**

When defining component templates using Vue APIs such as `Vue.createApp({ template: ... })`.

**Secure rules**

**Rule 1: Avoid passing untrusted user input directly as Vue component template strings.**

Ensure component templates are static or strictly controlled by application developers. Pass dynamic content via template interpolation or dynamic component props instead of string concatenation.

```javascript
Vue.createApp({
  template: `<div>{{ userProvidedString }}</div>`
}).mount('#app')
```


## Category: escape hatch

### Restrict the use of raw HTML rendering APIs like v-html

**Use when**

Rendering dynamic or user-supplied content inside Vue component templates where raw HTML injection could occur.

**Secure rules**

**Rule 1: Avoid passing unsanitized dynamic user content to the `v-html` directive or `innerHTML` property bindings.**

Use standard template interpolation via `{{ }}` for user text because it automatically escapes HTML using native APIs like `textContent`. If rendering dynamic HTML is strictly required, ensure the HTML string is properly sanitized first or rendered within a sandboxed environment.

```html
<template>
  <!-- Preferred safe usage -->
  <div>{{ userProvidedText }}</div>
</template>
```


## Category: injection

### Use object syntax for dynamic style bindings

**Use when**

Building dynamic styles and applying CSS properties using Vue style bindings

**Secure rules**

**Rule 1: Bind dynamic styles using object syntax to restrict values to explicit allowed properties.**

Avoid allowing user-controlled CSS strings in style bindings or style tags. Restrict dynamic style inputs using Vue style binding object syntax and explicit allowed properties such as color or background.

```html
<template>
  <a
    :href="sanitizedUrl"
    :style="{
      color: userProvidedColor,
      background: userProvidedBackground
    }"
  >
    Click me
  </a>
</template>
```


## Category: input contract definition

### Enforce Input Contracts on Component Props and Events

**Use when**

Defining and validating component boundaries such as props and emitted events to reject malformed or out-of-contract input before application processing.

**Secure rules**

**Rule 1: Declare runtime prop requirements for development warnings**

Use object-syntax `defineProps()` declarations with runtime types, `required` flags, and custom validators to specify the values a component expects. When these requirements are not met, Vue produces console warnings in the development build. These checks report invalid props but do not reject the received values.

```vue
<script setup>
defineProps({
  userId: {
    type: String,
    required: true
  },
  role: {
    type: String,
    validator(value) {
      return ['user', 'admin'].includes(value)
    }
  }
})
</script>
```

**Rule 2: Validate event payloads before emitting them**

Use `defineEmits` object syntax to document expected event payloads and report invalid arguments during development. Returning `false` from an event validator only triggers a warning and does not stop the event from being emitted. To prevent invalid data from reaching parent components, validate the payload explicitly before calling `emit()`.

```vue
<script setup lang="ts">
interface SubmitPayload {
  email: string
  password: string
}

function isValidSubmitPayload(payload: SubmitPayload): boolean {
  return (
    typeof payload.email === 'string' &&
    payload.email.includes('@') &&
    typeof payload.password === 'string'
  )
}

const emit = defineEmits({
  submit: (payload: SubmitPayload) => isValidSubmitPayload(payload)
})

function submitForm(email: string, password: string) {
  const payload = { email, password }

  if (!isValidSubmitPayload(payload)) {
    console.warn('Invalid submit event payload!')
    return
  }

  emit('submit', payload)
}
</script>
```


## Category: output encoding

### Sanitize Dynamic URLs in Vue Attribute Bindings

**Use when**

When rendering dynamic attributes like `:href` in Vue templates using untrusted data that may contain unsafe URL schemes.

**Secure rules**

**Rule 1: Validate and sanitize dynamically bound URLs before passing them to template attributes to prevent script execution.**

While Vue template interpolations using double curly braces escape text automatically, dynamic attribute bindings such as `:href` do not sanitize unsafe URL schemes like `javascript:`. Developers must validate and sanitize dynamically bound URLs before passing them to template attributes.

```html
<a :href="sanitizeUrl(author.html_url)" target="_blank" rel="noopener noreferrer">
  {{ commit.author.name }}
</a>
```


## Category: resource exhaustion

### Use shallowRef to prevent reactivity overhead on large datasets

**Use when**

When processing large data structures or arrays of deeply nested objects in Vue components to prevent CPU and memory exhaustion.

**Secure rules**

**Rule 1: Opt out of deep reactivity for large immutable or infrequently mutated data structures using `shallowRef()`.**

Vue's default reactivity system creates proxy traps for every nested property access, leading to severe CPU and memory overhead on massive datasets. Use `shallowRef()` to opt out of deep proxy wrapping and maintain fast property access, updating state by replacing the root reference.

```typescript
import { shallowRef } from 'vue'

const bigDataset = shallowRef([
  { id: 1, details: { /* deep nested properties */ } }
])

// Update state by creating a new array reference rather than modifying nested properties
bigDataset.value = [...bigDataset.value, newItem]
```


## Category: runtime environment hardening

### Deploy Production Vue Builds to Disable Development Debugging and Warning Hooks

**Use when**

Deploying Vue applications to production environments or configuring build pipelines.

**Secure rules**

**Rule 1: Configure build tools to replace `process.env.NODE_ENV` with 'production' or import explicit production bundles to strip devtools integrations and reactivity debugging hooks.**

When deploying Vue applications to production, configure your bundler to define `process.env.NODE_ENV` as 'production' or load explicit production files such as `vue.global.prod.js` to prevent external actors from inspecting internal component states and diagnostic warnings.

```js
new webpack.DefinePlugin({
  'process.env.NODE_ENV': JSON.stringify('production')
})
```


## Category: secret handling

### Restrict browser storage to non-sensitive preferences and validate data integrity

**Use when**

persisting non-sensitive UI settings or application state in browser storage such as `localStorage` or `sessionStorage` in a Vue application.

**Secure rules**

**Rule 1: Validate and whitelist persisted state before applying it**

Treat values restored from browser storage or URL fragments as untrusted input. Parse them inside a `try...catch`, verify the expected runtime types, and copy only explicitly allowed option values into a new object before applying the state. TypeScript assertions such as `as PersistedState` do not perform runtime validation.

```ts
interface PersistedState {
  src: string
  ssr: boolean
  options: {
    mode?: 'module' | 'function'
    whitespace?: 'preserve' | 'condense'
    hoistStatic?: boolean
    cacheHandlers?: boolean
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function sanitizeOptions(value: unknown): PersistedState['options'] {
  if (!isRecord(value)) return {}

  const options: PersistedState['options'] = {}

  if (value.mode === 'module' || value.mode === 'function') {
    options.mode = value.mode
  }

  if (value.whitespace === 'preserve' || value.whitespace === 'condense') {
    options.whitespace = value.whitespace
  }

  if (typeof value.hoistStatic === 'boolean') {
    options.hoistStatic = value.hoistStatic
  }

  if (typeof value.cacheHandlers === 'boolean') {
    options.cacheHandlers = value.cacheHandlers
  }

  return options
}

function loadSafeState(): PersistedState | undefined {
  try {
    const raw =
      decodeURIComponent(window.location.hash.slice(1)) ||
      localStorage.getItem('state')

    if (!raw) return undefined

    const parsed: unknown = JSON.parse(raw)

    if (
      !isRecord(parsed) ||
      typeof parsed.src !== 'string' ||
      typeof parsed.ssr !== 'boolean'
    ) {
      throw new Error('Invalid persisted state')
    }

    return {
      src: parsed.src,
      ssr: parsed.ssr,
      options: sanitizeOptions(parsed.options)
    }
  } catch (error) {
    console.warn('Invalid persisted state was discarded.', error)
    localStorage.removeItem('state')
    return undefined
  }
}
```


## Category: security control integrity

### Protect Provided Reactive State From Direct Mutation Using Readonly

**Use when**

Exposing reactive state through Vue's `provide()` mechanism to descendant components.

**Secure rules**

**Rule 1: Wrap provided reactive state with `readonly()` to prevent unauthorized or untracked state mutations by descendant injector components.**

When sharing state across component boundaries using `provide()`, wrap the reactive state using `readonly()` and explicitly expose dedicated update functions if controlled modification is required.

```vue
<script setup>
import { ref, provide, readonly } from 'vue'

const count = ref(0)

function updateCount(newValue) {
  count.value = newValue
}

provide('countState', {
  count: readonly(count),
  updateCount
})
</script>
```
