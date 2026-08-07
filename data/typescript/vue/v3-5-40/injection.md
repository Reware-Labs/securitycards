# Security cards

Repository: `https://github.com/vuejs/core#v3.5.40`
Documentation repository: `https://github.com/vuejs/docs#main`
Category: injection

## injection

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
