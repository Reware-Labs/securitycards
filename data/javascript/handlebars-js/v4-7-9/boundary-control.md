# Security cards

Repository: `https://github.com/handlebars-lang/handlebars.js#v4.7.9`
Category: boundary control

## boundary control

### Restrict Partial Context Scope Using explicitPartialContext

**Use when**

Compiling Handlebars templates that utilize partials and require isolation of context data across boundaries.

**Secure rules**

**Rule 1: Enable explicitPartialContext during template compilation to prevent partials from inheriting the full parent evaluation context implicitly.**

When compiling templates that render partials, set `explicitPartialContext` to `true` in the compiler options. This enforces boundary control by forcing partials to receive only explicitly passed parameters or data rather than automatically inheriting higher-scope properties.

```javascript
const template = Handlebars.compile('Dudes: {{> dude name="foo"}}', {
  explicitPartialContext: true
});
```
