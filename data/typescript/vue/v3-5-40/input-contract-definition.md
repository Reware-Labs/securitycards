# Security cards

Repository: `https://github.com/vuejs/core#v3.5.40`
Documentation repository: `https://github.com/vuejs/docs#main`
Category: input contract definition

## input contract definition

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
