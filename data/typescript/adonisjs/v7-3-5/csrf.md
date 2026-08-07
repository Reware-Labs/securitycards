# Security cards

Repository: `https://github.com/adonisjs/core#v7.3.5`
Documentation repository: `https://github.com/adonisjs/v7-docs#main`
Category: csrf

## csrf

### Include CSRF field tokens in server-rendered forms

**Use when**

Developing server-rendered form submissions using AdonisJS Shield.

**Secure rules**

**Rule 1: Include the CSRF token helper in every server-rendered form.**

Include the `{{ csrfField() }}` helper inside every server-rendered form when using `@adonisjs/shield` CSRF protection to ensure state-changing submissions include a valid token.

```html
<form method="POST" action="/posts">
  {{ csrfField() }}
  <input type="text" name="title">
  <button type="submit">Submit</button>
</form>
```
