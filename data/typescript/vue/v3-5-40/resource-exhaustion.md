# Security cards

Repository: `https://github.com/vuejs/core#v3.5.40`
Documentation repository: `https://github.com/vuejs/docs#main`
Category: resource exhaustion

## resource exhaustion

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
