# Security cards

Repository: `https://github.com/automattic/mongoose#9.8.0`
Category: escape hatch

## escape hatch

### Use Mongoose model methods instead of Model collection directly

**Use when**

performing routine database operations and handling untrusted data to ensure schema validation, type casting, and middleware hooks remain enforced

**Secure rules**

**Rule 1: Avoid passing user-defined objects directly as query filters**

Construct query filters from explicitly selected input fields instead of passing an entire user-defined object. Enable `sanitizeFilter` so Mongoose wraps nested objects containing `$`-prefixed properties in `$eq` to defend against query-selector injection.

```javascript
const docs = await MyModel.find({
  name: req.query.name,
  age: req.query.age
}).setOptions({ sanitizeFilter: true });
```
