# Security cards

Repository: `https://github.com/vuejs/core#v3.5.40`
Documentation repository: `https://github.com/vuejs/docs#main`
Category: dangerous execution

## dangerous execution

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
