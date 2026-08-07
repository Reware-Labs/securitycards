# Security cards

Repository: `https://github.com/vuejs/core#v3.5.40`
Documentation repository: `https://github.com/vuejs/docs#main`
Category: secret handling

## secret handling

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
