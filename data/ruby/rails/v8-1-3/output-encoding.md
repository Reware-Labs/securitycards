# Security cards

Repository: `https://github.com/rails/rails#v8.1.3`
Category: output encoding

## output encoding

### Prevent XSS by utilizing default HTML auto-escaping and avoiding raw output helpers

**Use when**

Rendering dynamic text, attributes, or user-supplied content within Action View ERB templates.

**Secure rules**

**Rule 1: Rely on standard ERB interpolation for automatic HTML encoding and avoid bypassing auto-escaping with the raw helper or unsafe modifiers.**

Action View automatically escapes HTML output in ERB view templates by default to prevent Cross-Site Scripting. Avoid passing untrusted user input directly to the raw helper or setting escape to false when using text truncation helpers, as both bypass automatic HTML encoding.

```html
<%= @comment.body %>
<%= truncate(user_supplied_text, length: 50) %>
```
