# Security cards

Repository: `https://github.com/handlebars-lang/handlebars.js#v4.7.9`
Category: input contract definition

## input contract definition

### Enforce strict compilation mode for required data bindings

**Use when**

Compiling Handlebars templates that require explicit data bindings and property validations.

**Secure rules**

**Rule 1: Configure Handlebars with strict compilation mode to reject missing input properties.**

Pass `{ strict: true }` to `Handlebars.compile()` when rendering templates that require explicit data bindings. This enforces required field enforcement by causing property lookups, child path accesses, missing data references, and undefined context objects to throw an exception instead of silently rendering empty string values.

```javascript
const Handlebars = require('handlebars');

const template = Handlebars.compile('{{hello.bar}}', {
  strict: true
});

try {
  const result = template({ hello: {} });
} catch (err) {
  console.error('Missing required property in context:', err.message);
}
```
