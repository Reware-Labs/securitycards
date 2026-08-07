# Security cards

Repository: `https://github.com/handlebars-lang/handlebars.js#v4.7.9`
Category: escape hatch

## escape hatch

### Restrict SafeString Usage to Sanitized HTML Content

**Use when**

When wrapping custom string values to prevent Handlebars from applying automatic HTML escaping.

**Secure rules**

**Rule 1: Use double-brace `{{…}}` for untrusted data and reserve `{{{…}}}`/`{{& …}}` for pre-sanitized HTML**

Handlebars v4.7.9 automatically HTML-escapes values rendered with standard double braces. Triple braces (`{{{…}}}`) or the ampersand form (`{{& …}}`) bypass this protection and must only be used with content that is already safe to insert as raw HTML.

```javascript
const Handlebars = require('handlebars');

// Escaped output for user-supplied data
const tpl = Handlebars.compile(
  '<p>{{userInput}}</p>\n<p>{{{trustedHtml}}}</p>'
);

console.log(
  tpl({
    userInput: '<script>alert("xss")</script>', // will be escaped
    trustedHtml: '<strong>Hello</strong>'       // already sanitized
  })
);
// => <p>&lt;script&gt;alert("xss")&lt;/script&gt;</p>
//    <p><strong>Hello</strong></p>
```
