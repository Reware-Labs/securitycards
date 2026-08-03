# Security cards

Repository: `https://github.com/symfony/symfony#v8.1.1`
Category: output encoding

## output encoding

### Escape last username values during HTML rendering

**Use when**

Rendering the last authenticated username value derived from request or session input inside HTML templates to prevent Cross-Site Scripting.

**Secure rules**

**Rule 1: Apply context-appropriate output encoding to the last username value before inserting it into HTML output.**

Treat the value returned by `AuthenticationUtils::getLastUsername()` as untrusted input. Rely on Twig auto-escaping in HTML context or manually escape output using `htmlspecialchars()` with `ENT_QUOTES | ENT_SUBSTITUTE` and `UTF-8` encoding when rendering raw PHP templates.

```php
// Twig auto-escapes variables in HTML context by default:
// <input type="text" name="_username" value="{{ last_username }}">

// If rendering raw PHP templates, manually escape output:
$safeUsername = htmlspecialchars($authenticationUtils->getLastUsername(), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
```
