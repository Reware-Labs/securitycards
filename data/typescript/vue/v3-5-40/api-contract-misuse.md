# Security cards

Repository: `https://github.com/vuejs/core#v3.5.40`
Documentation repository: `https://github.com/vuejs/docs#main`
Category: api contract misuse

## api contract misuse

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
