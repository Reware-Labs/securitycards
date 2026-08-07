# Security cards

Repository: `https://github.com/handlebars-lang/handlebars.js#v4.7.9`
Category: output encoding

## output encoding

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
