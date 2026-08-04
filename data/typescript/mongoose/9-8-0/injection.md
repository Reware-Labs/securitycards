# Security cards

Repository: `https://github.com/automattic/mongoose#9.8.0`
Category: injection

## injection

### Use standard query operators and structured parameter binding instead of string concatenation in Mongoose queries

**Use when**

Building Mongoose queries or aggregation pipelines using user-supplied input where unvalidated structures or concatenated strings can lead to injection.

**Secure rules**

**Rule 1: Avoid untrusted string concatenation or dynamic code execution in `$where` expressions.**

Do not pass user-controlled input or concatenated strings directly into `$where()` expressions because `$where` executes JavaScript code directly on the MongoDB server. Prefer standard Mongoose query operators like `$eq`, `$gt`, or `$expr` to ensure query parameters remain separated from query syntax.

```javascript
// UNSAFE
User.find().$where(`this.username === '${req.body.username}'`);

// SAFE
User.find({ username: req.body.username });
```

**Rule 2: Enable sanitizeFilter to neutralize NoSQL operator injection globally.**

Configure `sanitizeFilter` globally during application initialization before defining or executing queries. When untrusted input containing object structures with keys starting with `$` is passed into query filters, enabling this option ensures they are wrapped safely.

```javascript
const mongoose = require('mongoose');

mongoose.set('sanitizeFilter', true);
```

**Rule 3: Explicitly cast and sanitize user input in aggregation pipelines.**

Always explicitly cast field types, such as using `mongoose.Types.ObjectId`, and sanitize user input before passing it into pipeline operators since aggregation stages bypass automatic schema casting.

```javascript
const cleanId = new mongoose.Types.ObjectId(req.params.id);
const results = await MyModel.aggregate([
  { $match: { _id: cleanId, status: 'active' } }
]);
```
