# Security cards

Repository: `https://github.com/handlebars-lang/handlebars.js#v4.7.9`
Category: injection

## injection

### Safely serialize variable names and validate configuration options in custom compiler extensions

**Use when**

Extending Handlebars.JavaScriptCompiler or programmatically invoking the precompiler API with custom configuration options.

**Secure rules**

**Rule 1: Serialize name identifiers safely using `JSON.stringify` or standard compiler invocation methods when customizing code generation.**

When extending `Handlebars.JavaScriptCompiler` to override `nameLookup`, format name identifiers safely using `JSON.stringify` rather than raw string concatenation to prevent code injection during template compilation.

```javascript
function MyCompiler() {
  Handlebars.JavaScriptCompiler.apply(this, arguments);
}
MyCompiler.prototype = new Handlebars.JavaScriptCompiler();

MyCompiler.prototype.nameLookup = function(parent, name, type) {
  if (type === 'context') {
    return this.source.functionCall('helpers.lookupLowerCase', '', [parent, JSON.stringify(name)]);
  } else {
    return Handlebars.JavaScriptCompiler.prototype.nameLookup.call(this, parent, name, type);
  }
};
```

**Rule 2: Ensure precompiler options conform to standard identifier formats and use strict validation for module paths.**

When programmatically calling the precompiler via `cli(opts)`, ensure options such as `namespace`, `commonjs`, and `handlebarPath` contain trusted inputs or conform strictly to standard identifier formats to prevent arbitrary JavaScript code injection.

```javascript
const precompiler = require('handlebars/lib/precompiler');

precompiler.cli({
  templates: [{ name: 'userCard', source: '<div>{{name}}</div>' }],
  namespace: 'MyApp.Templates',
  commonjs: 'handlebars/runtime'
});
```
