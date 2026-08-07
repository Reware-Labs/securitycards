# Security cards

Repository: `https://github.com/handlebars-lang/handlebars.js#v4.7.9`
Category: api contract misuse

## api contract misuse

### Validate dynamic partial names against an allowlist before execution

**Use when**

Rendering templates that use dynamic partial names resolved at runtime.

**Secure rules**

**Rule 1: Validate dynamic partial names that come from external input**

Dynamic partial syntax such as `{{> (lookup . "key")}}` must never render user-controlled names without first confirming that the name is one of the partials you have explicitly registered. Unresolved names already throw an exception in the v4.7.9 runtime, and past RCE vulnerabilities were exploitable when attackers supplied crafted values through dynamic lookups.
When the name can vary:

* Build with the **runtime-only** package (`require('handlebars/runtime')`) so fallback compilation is disabled.
* Keep a private map of trusted, pre-registered partials and return a safe default if the requested name is not in that map.

```javascript
// runtime-only build – no compile() fallback
const Handlebars = require('handlebars/runtime');

// trusted, pre-compiled partials
const PARTIALS = {
  user_card: require('./templates/user_card.js'),
  item_card: require('./templates/item_card.js')
};
for (const [name, fn] of Object.entries(PARTIALS)) {
  Handlebars.registerPartial(name, fn);
}

// helper returns a partial name only if it is trusted
Handlebars.registerHelper('safePartialName', (name) =>
  Object.prototype.hasOwnProperty.call(PARTIALS, name) ? name : 'user_card'
);

// main template was precompiled with `{{> (safePartialName which)}}`
const render = require('./templates/main.js');
console.log(render({ which: 'item_card', item: 'Book', name: 'Alice' }));
```
