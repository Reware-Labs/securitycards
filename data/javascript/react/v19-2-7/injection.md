# Security cards

Repository: `https://github.com/react/react#v19.2.7`
Documentation repository: `https://github.com/reactjs/react.dev#main`
Category: injection

## injection

### Filter and Validate Component Props Before Rendering or Spreading Onto Intrinsic Elements

**Use when**

Building React components that accept and forward untrusted props or render dynamic content from component properties.

**Secure rules**

**Rule 1: Forward only allow-listed DOM props to intrinsic elements**

Before you spread an object onto a native JSX tag, build an explicit **allow-list** of attribute names (or apply a predicate that accepts only known DOM and `data-*/aria-*` attributes).
Everything else—including misspelled, framework-specific, or user-supplied props—**must be stripped** so it never reaches the browser or silently triggers React’s *Unknown Prop* warning.

```tsx
// safe-button.tsx
import React from 'react';

const ALLOWED = new Set([
  // core HTML attributes you actually need
  'id',
  'className',
  'type',
  'disabled',
  'title',
  'onClick',
  // always permit data-/aria- attributes for accessibility & instrumentation
]);

function filterDomProps(src: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(src)) {
    if (ALLOWED.has(key) || key.startsWith('data-') || key.startsWith('aria-')) {
      out[key] = value;
    }
  }
  return out;
}

export default function SafeButton(
  props: React.PropsWithChildren<{ variant?: 'primary' | 'secondary' }> &
    Record<string, unknown>,
) {
  const { variant = 'primary', children, ...rest } = props;
  const domProps = filterDomProps(rest);

  return (
    <button className={`btn-${variant}`} {...domProps}>
      {children}
    </button>
  );
}
```


### Prevent Dynamic Code Execution in Configuration and Template Processing

**Use when**

Parsing dynamic component configuration strings, compiler overrides, or string concatenation expressions from ASTs.

**Secure rules**

**Rule 1: Parse dynamic configuration strings using safe structured serialization formats instead of evaluating expressions dynamically.**

Avoid executing untrusted configuration text using `eval()` or `new Function(...)`. Use `JSON.parse` or secure structured data formats to safely deserialize override options.

```javascript
try {
  const configOverrideOptions = JSON.parse(configOverrides);
  return parsePluginOptions({ ...baseOptions, ...configOverrideOptions });
} catch (e) {
  throw new Error('Invalid configuration format');
}
```

**Rule 2: Safely process template AST nodes and expression strings by whitelisting node types without invoking arbitrary code execution.**

When extracting or evaluating string expressions from an Abstract Syntax Tree, explicitly match supported node types like `StringLiteral`, `Literal`, and binary addition operators. Throw explicit errors on unsupported types rather than falling back to dangerous evaluation functions.

```javascript
function evalStringConcat(ast) {
  switch (ast.type) {
    case 'StringLiteral':
    case 'Literal':
      return ast.value;
    case 'BinaryExpression':
      if (ast.operator !== '+') {
        throw new Error('Unsupported binary operator ' + ast.operator);
      }
      return evalStringConcat(ast.left) + evalStringConcat(ast.right);
    default:
      throw new Error('Unsupported type ' + ast.type);
  }
}
```
