# Security cards

Repository: `https://github.com/automattic/mongoose#9.8.0`
Category: input interpretation safety

## input interpretation safety

### Strictly Validate and Cast Input Parameters to Prevent Interpretation Bypasses

**Use when**

Handling untrusted user inputs or query parameters in Mongoose schemas, queries, and validation workflows.

**Secure rules**

**Rule 1: Use `isObjectIdOrHexString()` for strict ObjectId input validation**

Use `mongoose.isObjectIdOrHexString()` when an input contract should accept only an ObjectId instance or a 24-character hexadecimal string. Do not treat `isValidObjectId()` as an equivalent strict validator because its documented contract is whether Mongoose can coerce the value to an ObjectId.

```javascript
function requireObjectId(value) {
  if (!mongoose.isObjectIdOrHexString(value)) {
    throw new TypeError(
      'Expected an ObjectId or a 24-character hexadecimal string'
    );
  }

  return value;
}

const userId = requireObjectId('62261a65d66c6be0a63c051f');
```

**Rule 2: Catch and handle `CastError` exceptions from incompatible user inputs.**

Wrap Mongoose operations in try-catch blocks to handle `CastError` exceptions raised when casting invalid or malformed inputs, ensuring type discrepancies do not cause unhandled rejections or server crashes.

```javascript
try {
  const user = new UserModel(req.body);
  await user.save();
} catch (err) {
  if (err.name === 'CastError' || err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Invalid input format' });
  }
  throw err;
}
```
