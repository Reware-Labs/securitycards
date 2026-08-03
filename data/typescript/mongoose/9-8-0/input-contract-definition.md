# Security cards

Repository: `https://github.com/automattic/mongoose#9.8.0`
Category: input contract definition

## input contract definition

### Configure Schema Strictness and Validation Boundaries

**Use when**

Defining schemas and processing external input payloads to prevent mass assignment and ensure valid data types, enums, ranges, and required properties.

**Secure rules**

**Rule 1: Configure strict writes and strict reads separately**

Use `strict` to control unknown fields supplied through constructors, setters, and updates. `strict: true` strips them, while `strict: "throw"` rejects them. Configure `strictRead` separately for documents hydrated from MongoDB: `strictRead: true` strips unknown stored fields, and `strictRead: "throw"` rejects documents containing them. `strict` defaults to `true`, but `strictRead` defaults to `false`.

```javascript
const userSchema = new mongoose.Schema(
  {
    name: String,
    role: {
      type: String,
      enum: ['user', 'admin']
    }
  },
  {
    strict: 'throw',
    strictRead: 'throw'
  }
);

const User = mongoose.model('User', userSchema);

await User.create({
  name: 'Alice',
  role: 'user'
});
```

**Rule 2: Define explicit schema validation boundaries including required fields, string enum sets, regular expressions, and numeric limits.**

Explicitly define schema validation boundaries including required fields, string enum sets, regular expressions, and numeric min/max limits. Ensure invalid options throw schema initialization errors rather than misconfiguring validation rules.

```javascript
const userSchema = new Schema({
  role: { type: String, enum: ['admin', 'user'], required: true },
  age: { type: Number, min: 18, max: 120 },
  code: { type: String, match: /^[A-Z0-9]+$/ }
});
```
