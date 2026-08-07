# Security cards

Repository: `https://github.com/vuejs/core#v3.5.40`
Documentation repository: `https://github.com/vuejs/docs#main`
Category: boundary control

## boundary control

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
