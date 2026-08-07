# Security cards

Repository: `https://github.com/vuejs/core#v3.5.40`
Documentation repository: `https://github.com/vuejs/docs#main`
Category: output encoding

## output encoding

### Sanitize Dynamic URLs in Vue Attribute Bindings

**Use when**

When rendering dynamic attributes like `:href` in Vue templates using untrusted data that may contain unsafe URL schemes.

**Secure rules**

**Rule 1: Validate and sanitize dynamically bound URLs before passing them to template attributes to prevent script execution.**

While Vue template interpolations using double curly braces escape text automatically, dynamic attribute bindings such as `:href` do not sanitize unsafe URL schemes like `javascript:`. Developers must validate and sanitize dynamically bound URLs before passing them to template attributes.

```html
<a :href="sanitizeUrl(author.html_url)" target="_blank" rel="noopener noreferrer">
  {{ commit.author.name }}
</a>
```
