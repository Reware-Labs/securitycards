# Security cards

Repository: `https://github.com/hapijs/joi#v18.2.3`
Category: input interpretation safety

## input interpretation safety

### Enforce Strict Type Checking and Input Conversion Settings

**Use when**

Validating untrusted input where exact types and unambiguous string interpretations are security-critical.

**Secure rules**

**Rule 1: Disable implicit type casting on schemas to prevent unexpected data coercion.**

By default, `joi` attempts to coerce input types to match schema definitions. When validating untrusted input where exact types are security-critical, call `.strict()` on the schema or configure `{ convert: false }` in validation preferences to disable implicit type casting.

```javascript
const Joi = require('joi');

const schema = Joi.object({
    userId: Joi.number().strict()
});

const { error, value } = schema.validate({ userId: '123' });
```

**Rule 2: Disable input conversion for strict symbol mapping to prevent untrusted key execution.**

When using `Joi.symbol().map()` to convert string or numeric input keys into internal Symbol instances, recognize that `joi` automatically coerces matching keys by default. To prevent untrusted string inputs from being translated into internal application Symbols, explicitly configure schema preferences with `convert` set to `false`.

```javascript
const PRIVILEGED_SYMBOL = Symbol('PRIVILEGED');

const symbolSchema = Joi.symbol()
  .map(new Map([['admin_key', PRIVILEGED_SYMBOL]]))
  .prefs({ convert: false });

const { error, value } = symbolSchema.validate('admin_key');
```


### Manage Object Key Aliasing and Renaming Explicitly

**Use when**

Renaming or aliasing object properties during schema validation to ensure unambiguous and canonical data interpretation.

**Secure rules**

**Rule 1: Configure explicit alias options when renaming keys to prevent parameter ambiguity and unexpected data loss.**

When using `.rename(from, to, options)`, `joi` defaults to removing the source property key. Explicitly set `alias: true` in the rename options if downstream handlers require preserving the original property key alongside the renamed key, or leave it as false to eliminate legacy keys.

```typescript
import Joi from 'joi';

const schema = Joi.object({
  userId: Joi.string().required(),
  user_id: Joi.string()
}).rename('user_id', 'userId', { alias: true, override: true });
```

**Rule 2: Isolate property alias transformations within schema alternative branches.**

Ensure that key renaming operations inside schema alternatives are scoped safely. `joi` guarantees that key renaming side effects from a failed schema branch are discarded and not applied to subsequent alternative evaluations.

```javascript
const schema = Joi.object({
  a: Joi.alternatives([
    Joi.object({ c: Joi.any(), d: Joi.number() }).rename('b', 'c'),
    Joi.object({ b: Joi.any(), d: Joi.string() })
   الموضوع
});
```


### Prevent Prototype Pollution by Validating Untrusted Objects with Joi Schemas

**Use when**

Parsing and validating untrusted input objects and JSON payloads to ensure prototype properties like `__proto__` are securely stripped or rejected.

**Secure rules**

**Rule 1: Pass untrusted input objects through `Joi.object()` schemas to safely strip or ignore injected `__proto__` properties.**

When handling untrusted data, always run parsed input through explicit Joi object schemas using `schema.validate()` so that internal prototype properties and injected prototype pollution vectors are not preserved in validated output objects.

```javascript
const Joi = require('joi');

const schema = Joi.object({
  name: Joi.string().required()
});

const payload = JSON.parse(untrustedInput);
const { value, error } = schema.validate(payload);
if (!error) {
  // value is safely validated and Object.prototype is preserved
}
```

**Rule 2: Enforce strict key boundaries and disallow unknown keys on object validation schemas.**

Explicitly specify expected properties using `.keys()` and strictly enforce boundaries with `.unknown(false)` to prevent unvalidated properties such as `__proto__` or `constructor` from persisting in validated output objects.

```javascript
const Joi = require('joi');

const userSchema = Joi.object().keys({
    username: Joi.string().required(),
    email: Joi.string().email().required()
}).unknown(false);
```
