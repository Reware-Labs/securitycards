# Security cards

Repository: `https://github.com/handlebars-lang/handlebars.js#v4.7.9`

## Category: access control

### Restrict prototype access options during template compilation and rendering

**Use when**

Rendering templates with context objects where prototype properties and methods must be restricted to prevent unauthorized access or prototype pollution.

**Secure rules**

**Rule 1: Keep prototype access restrictions enabled during template execution and explicitly whitelist individual properties if required.**

Ensure that `allowProtoMethodsByDefault` and `allowProtoPropertiesByDefault` are set to `false` in the runtime options when rendering templates, and explicitly whitelist only approved properties.

```javascript
const template = Handlebars.compile(templateSource);
const result = template(context, {
  allowProtoMethodsByDefault: false,
  allowProtoPropertiesByDefault: false,
  allowedProtoProperties: {
    allowedProperty: true
  }
});
```


## Category: api contract misuse

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


## Category: boundary control

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


## Category: dangerous execution

### Use precompiled partials in runtime-only Handlebars environments

**Use when**

Building and running applications using the standalone Handlebars runtime environment where dynamic template compilation is restricted.

**Secure rules**

**Rule 1: Precompile templates and partials for runtime-only builds**

The lightweight `handlebars/runtime` bundle does **not** include the compiler. Any attempt to render a string template or partial triggers an error, so compile every template and partial during your build step (e.g., with the `handlebars` CLI) and register the resulting functions before rendering.

```javascript
import Handlebars from 'handlebars/runtime';

// functions generated at build time by `handlebars --precompile`
import mainTpl from './templates/main.hbs.js';
import headerPartial from './templates/header.hbs.js';

// make the precompiled partial available
Handlebars.registerPartial('header', headerPartial);

// render safely at runtime-only
console.log(mainTpl({ title: 'Hello Handlebars' }));
```


## Category: injection

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


## Category: input contract definition

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


## Category: input interpretation safety

### Validate AST Node Types and Reject Raw AST Objects during Compilation

**Use when**

Compiling template strings or processing custom abstract syntax trees in Handlebars to prevent parser bypass and AST type confusion.

**Secure rules**

**Rule 1: Always compile trusted raw template strings and reject untrusted pre-parsed AST objects.**

Pass raw string templates directly into `Handlebars.compile()` rather than supplying unvalidated or attacker-controlled AST structures, which bypasses parser validation and can lead to arbitrary code execution.

```javascript
const template = Handlebars.compile('Hello {{name}}');
const output = template({ name: 'World' });
```

**Rule 2: Verify AST structural integrity and node properties using built-in traversal methods.**

When writing custom visitors or compiler extensions, use methods like `acceptRequired`, `acceptArray`, and `acceptKey` to enforce that node types and required properties exist before processing.

```javascript
import Handlebars from 'handlebars';

function CustomVisitor() {
  Handlebars.Visitor.call(this);
}
CustomVisitor.prototype = Object.create(Handlebars.Visitor.prototype);

CustomVisitor.prototype.MustacheStatement = function(mustache) {
  this.acceptRequired(mustache, 'path');
  this.acceptArray(mustache.params);
  this.acceptKey(mustache, 'hash');
};
```


## Category: output encoding

### Use standard double-brace expressions and escape untrusted template output

**Use when**

Rendering dynamic or user-supplied data within Handlebars templates and custom helpers to prevent cross-site scripting.

**Secure rules**

**Rule 1: Sanitize helper output before returning SafeString instances.**

Sanitize dynamic input using `Handlebars.Utils.escapeExpression` before wrapping content in `Handlebars.SafeString` or outputting raw HTML from custom helpers.

```typescript
Handlebars.registerHelper('agree_button', function(this: any) {
  const safeEmotion = Handlebars.Utils.escapeExpression(this.emotion);
  const safeName = Handlebars.Utils.escapeExpression(this.name);
  return new Handlebars.SafeString(
    '<button>I agree. I ' + safeEmotion + ' ' + safeName + '</button>'
  );
});
```

**Rule 2: Set `escaped: true` on `MustacheStatement` nodes you build so dynamic values are HTML-escaped**

When you create or modify a Handlebars AST programmatically, include `escaped: true` on each `MustacheStatement` that should use the engine’s default HTML-escaping. If you omit the property—or set it to `false`—the compiler treats the expression as unescaped and emits raw output.

```javascript
const Handlebars = require('handlebars');

// Hand-built AST with escaping enabled
const ast = {
  type: 'Program',
  body: [{
    type: 'MustacheStatement',
    path: {                 // {{userInput}}
      type: 'PathExpression',
      data: false,
      depth: 0,
      parts: ['userInput'],
      original: 'userInput'
    },
    params: [],
    hash: { type: 'Hash', pairs: [] },
    escaped: true           // keep the default HTML-escaping
  }],
  blockParams: []
};

const tmpl = Handlebars.compile(ast);

console.log(
  tmpl({ userInput: '<script>alert(1)</script>' })
);
// → &lt;script&gt;alert(1)&lt;/script&gt;
```

**Rule 3: Maintain HTML entity encoding when applying whitespace control.**

Use double-curly syntax with whitespace control tags for any untrusted dynamic input to ensure HTML encoding is enforced without bypassing escaping.

```javascript
var template = Handlebars.compile(' {{~userInput~}} ');
var output = template({ userInput: '<script>alert(1)</script>' });
```

**Rule 4: Keep `noEscape` **false** so `{{…}}` output stays HTML-escaped**

The compiler option `noEscape` turns off Handlebars’ automatic HTML escaping for **all** mustache expressions in a template. Leave it at its default `false` when rendering data you don’t fully trust.

```javascript
import Handlebars from 'handlebars';

// Default (safe): escapes <script> tags
const safeTpl   = Handlebars.compile('<div>{{userInput}}</div>');
console.log(safeTpl({ userInput: '<script>alert(1)</script>' }));
// → <div>&lt;script&gt;alert(1)&lt;/script&gt;</div>

// Dangerous: disables escaping for every {{…}}
const unsafeTpl = Handlebars.compile('<div>{{userInput}}</div>', { noEscape: true });
console.log(unsafeTpl({ userInput: '<script>alert(1)</script>' }));
// → <div><script>alert(1)</script></div>
```


## Category: security control integrity

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
