# Security cards

Repository: `https://github.com/handlebars-lang/handlebars.js#v4.7.9`
Category: security control integrity

## security control integrity

### Restrict helper execution using knownHelpersOnly when compiling templates

**Use when**

When compiling untrusted template strings to enforce strict compilation boundaries and prevent dynamic resolution of unlisted functions.

**Secure rules**

**Rule 1: Pass options.knownHelpersOnly set to true alongside an explicit options.knownHelpers whitelist during template compilation.**

Pass `knownHelpersOnly: true` and list allowed helper names in `knownHelpers` when compiling untrusted template definitions to ensure the compiler rejects any unknown helper expressions at compile time.

```javascript
const template = Handlebars.compile(userTemplate, {
  knownHelpers: {
    if: true,
    each: true,
    customHelper: true
  },
  knownHelpersOnly: true
});
```
