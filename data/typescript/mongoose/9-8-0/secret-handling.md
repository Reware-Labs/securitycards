# Security cards

Repository: `https://github.com/automattic/mongoose#9.8.0`
Category: secret handling

## secret handling

### Supply Database Credentials Securely and Exclude Sensitive Fields

**Use when**

Configuring database connections and defining schema projections in Mongoose.

**Secure rules**

**Rule 1: Supply database credentials using environment variables instead of hardcoding them in source code.**

Avoid hardcoding plain-text database credentials or connection strings containing passwords directly in application source code when calling `connect` or `createConnection`. Pass credentials dynamically using environment variables or dedicated secret management stores.

```javascript
import { connect } from 'mongoose';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI environment variable is required');
}

await connect(uri, {
  user: process.env.MONGODB_USER,
  pass: process.env.MONGODB_PASS
});
```

**Rule 2: Exclude sensitive fields from default query projections using schema options.**

Set `select: false` on schema paths storing sensitive data like password hashes, API keys, or session tokens to exclude them by default from query projections.

```javascript
const userSchema = new Schema({
  username: { type: String, required: true },
  passwordHash: { type: String, select: false }
});
```
