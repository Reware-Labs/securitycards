# Security cards

Repository: `https://github.com/handlebars-lang/handlebars.js#v4.7.9`
Category: input interpretation safety

## input interpretation safety

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
