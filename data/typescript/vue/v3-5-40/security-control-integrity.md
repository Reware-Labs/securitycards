# Security cards

Repository: `https://github.com/vuejs/core#v3.5.40`
Documentation repository: `https://github.com/vuejs/docs#main`
Category: security control integrity

## security control integrity

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
