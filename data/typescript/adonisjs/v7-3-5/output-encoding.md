# Security cards

Repository: `https://github.com/adonisjs/core#v7.3.5`
Documentation repository: `https://github.com/adonisjs/v7-docs#main`
Category: output encoding

## output encoding

### Escape Dynamic Values in Translated Edge Templates

**Use when**

Rendering internationalized translation strings with dynamic user-supplied interpolation parameters inside Edge templates.

**Secure rules**

**Rule 1: Use default double curly braces for rendering translations to automatically HTML-escape dynamic interpolation parameters.**

When outputting translated messages using `t(...)` in Edge templates, rely on standard double curly braces `{{ t(...) }}` rather than unescaped triple curly braces `{{{ t(...) }}}`. This ensures that any user-supplied interpolation variables are safely HTML-escaped to prevent Cross-Site Scripting vulnerabilities.

```edge
{{-- Secure: Escapes dynamic values automatically --}}
{{ t('messages.greeting', { username: user.name }) }}
```
