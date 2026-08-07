# Security cards

Repository: `https://github.com/vuejs/core#v3.5.40`
Documentation repository: `https://github.com/vuejs/docs#main`
Category: escape hatch

## escape hatch

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
