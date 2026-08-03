# Security cards

Repository: `https://github.com/automattic/mongoose#9.8.0`

## Category: access control

### Enforce Tenant Isolation and Authorization Filters in Save Hooks

**Use when**

When saving documents in Mongoose where updating existing records could bypass tenant ownership or authorization boundaries.

**Secure rules**

**Rule 1: Set document-level query filters inside pre-save middleware hooks to enforce tenant isolation and ownership rules.**

When updating existing documents where `$isNew` is false, assign additional filter conditions such as `tenantId` and `isDeleted` checks to `this.$where` inside a `pre('save')` hook to prevent unauthorized cross-tenant modifications.

```javascript
userSchema.pre('save', function() {
  if (!this.isNew) {
    this.$where = { tenantId: this.$locals.tenantId, isDeleted: false };
  }
});
```


## Category: api contract misuse

### Manage Transaction Sessions and Atomic Operations Correctly

**Use when**

When executing database transactions and handling modifications on partial or subdocument query results.

**Secure rules**

**Rule 1: Attach the session to every operation that must participate in a manually managed transaction**

Pass the same session to every operation intended to participate in a manually managed transaction. An operation without the session executes outside the transaction and cannot see that transaction's uncommitted writes. Use the `session` option for writes and `.session(session)` for queries. Manual propagation is unnecessary inside a `Connection#transaction()` executor when `transactionAsyncLocalStorage` is enabled because Mongoose attaches the session automatically.

````javascript
const Customer = mongoose.model(
  'Customer',
  new mongoose.Schema({ name: String })
);

await Customer.createCollection();

const session = await mongoose.startSession();

try {
  await session.withTransaction(async () => {
    await Customer.create(
      [{ name: 'Test' }],
      { session }
    );

    await Customer.findOne({ name: 'Test' }).session(session);
  });
} finally {
  await session.endSession();
}
```**Rule 1: Set `authSource` when credentials belong to a different database**

MongoDB users are scoped to a database. When the credentials supplied through Mongoose's `user` and `pass` options are stored in a database other than the target application database, set `authSource` to the database that contains those credentials.

```javascript
await mongoose.connect('mongodb://127.0.0.1:27017/application', {
  user: 'appUser',
  pass: 'examplePassword',
  authSource: 'admin'
});
````

**Rule 2: Use atomic array methods on partial array projections before saving documents.**

When documents are loaded with partial array projections such as `$slice`, perform modifications using atomic methods like `.push()` or use direct query methods like `updateOne()`. Non-atomic mutations on partial arrays followed by `doc.save()` cause `DivergentArrayError` exceptions.

```javascript
const doc = await Post.findById(id).select({ numbers: { $slice: -1 } });

doc.numbers.push(4);
await doc.save();

await Post.updateOne({ _id: id }, { $push: { numbers: 4 } });
```


### Properly Structure API Calls and Argument Signatures

**Use when**

When invoking Mongoose query and connection APIs that require specific argument formats, method call sequences, or signature structures.

**Secure rules**

**Rule 1: Specify query projections using space-delimited string syntax or projection objects.**

When configuring field selections with `Query.prototype.select`, pass either a single space-separated string or an object representation. Passing multiple separate string arguments violates the expected method signature and results in runtime exceptions.

```javascript
query.select('name email -password');

query.select({ name: 1, email: 1, password: 0 });
```

**Rule 2: Create fresh connection instances instead of reusing destroyed connections.**

When a connection instance has been closed via `destroy()`, do not call `openUri()` on it. Instantiate a new connection using `mongoose.createConnection()` or `mongoose.connect()` to maintain proper connection lifecycles.

```javascript
await conn.destroy();

const newConn = mongoose.createConnection(uri);
await newConn.asPromise();
```


## Category: authentication

### Configure database credentials and authentication options for Mongoose connections

**Use when**

Establishing a database connection in Mongoose that requires user credentials and explicit authentication settings.

**Secure rules**

**Rule 1: Explicitly define authentication sources and credentials when connecting to MongoDB databases.**

When configuring authentication credentials for Mongoose connections, explicitly set `authSource` if user credentials are created on a database other than the target application database. Additionally, when using X.509 authentication, embed the username inside the connection string and supply client certificate configurations via connection options.

```javascript
mongoose.connect('mongodb://127.0.0.1:27017/myapp', {
  user: process.env.MONGO_USER,
  pass: process.env.MONGO_PASS,
  authSource: 'admin'
});
```


## Category: boundary control

### Specify Target Scope for Deletion Middleware Boundary Checks

**Use when**

Implementing deletion middleware or security hooks to ensure boundary checks execute correctly across document and query operations.

**Secure rules**

**Rule 1: Explicitly configure hook targets for both query and document execution contexts when security checks are required for delete operations.**

Mongoose distinguishes document middleware from query middleware. Hooks intended for deletion boundary checks or cascading security cleanups must explicitly specify their target scope to avoid bypassed authorization checks during static model query deletions.

```javascript
const schema = new Schema({ name: String });

schema.pre('deleteOne', { query: true, document: true }, function() {
  if (this instanceof mongoose.Query) {
    // Handle query-level deletion security logic
  } else {
    // Handle document instance deletion security logic
  }
});
```


## Category: cryptography

### Configure Client-Side Field-Level Encryption and Auto-Encryption Options

**Use when**

Defining schemas with sensitive paths requiring cryptographic protection and initializing database connections with key management configurations.

**Secure rules**

**Rule 1: Declare encryption metadata on schema paths using explicit BSON types and supply `autoEncryption` options during connection initialization.**

Specify cryptographic parameters such as `keyId` and algorithm definitions directly on sensitive schema paths using supported BSON-compatible types, and configure `autoEncryption` options including `kmsProviders` and `keyVaultNamespace` when opening the database connection.

```javascript
const schema = new Schema({
  ssn: {
    type: String,
    encrypt: {
      keyId: [dataKeyUUID],
      algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random'
    }
  }
}, {
  encryptionType: 'csfle'
});

const connection = createConnection();
const User = connection.model('User', schema);

await connection.openUri(connectionUri, {
  autoEncryption: {
    keyVaultNamespace: 'keyvault.datakeys',
    kmsProviders: {
      local: { key: localKmsKeyBuffer }
    }
  }
});
```


## Category: dangerous execution

### Restrict Update Pipeline Usage

**Use when**

When performing update queries in Mongoose where untrusted input might otherwise be passed to `updatePipeline`.

**Secure rules**

**Rule 1: Keep updatePipeline set to false or strictly validate and sanitize all pipeline stages before passing them to update methods.**

Avoid enabling updatePipeline: true when executing update queries with untrusted input because Mongoose explicitly disables update pipelines by default and update pipeline operations are not schema-cast.

```typescript
await Model.updateOne({ _id: id }, [{ $set: { status: sanitizedStatus } }], { updatePipeline: true });
```


## Category: escape hatch

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


## Category: injection

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


## Category: input contract definition

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


## Category: input driven boundary selection

### Constrain Dynamic Model Lookups with Schema Enums

**Use when**

When defining schemas that use dynamic document references via `refPath` to populate documents from untrusted sources.

**Secure rules**

**Rule 1: Whitelisted allowed target models using schema enum validation on the discriminator path.**

When using dynamic document references via `refPath`, always constrain the discriminator field in the schema using an `enum` validator to prevent attackers from querying or populating arbitrary models within the application.

```javascript
const commentSchema = new Schema({
  body: { type: String, required: true },
  doc: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'docModel'
  },
  docModel: {
    type: String,
    required: true,
    enum: ['BlogPost', 'Product']
  }
});
```


## Category: input interpretation safety

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


## Category: network boundary

### Restrict MongoDB network access to trusted IP ranges

**Use when**

Configuring database cluster network connections and firewall rules to restrict network access.

**Secure rules**

**Rule 1: Use TLS and keep certificate validation enabled in production**

Enable TLS when connecting with a `mongodb://` URI. Keep Mongoose's default TLS certificate validation enabled in production; do not enable `tlsAllowInvalidCertificates` or `tlsInsecure`. When the server certificate requires a specific certificate authority, configure `tlsCAFile` with the allowed CA certificate.

```javascript
await mongoose.connect('mongodb://127.0.0.1:27017/test', {
  tls: true,
  tlsCAFile: `${__dirname}/rootCA.pem`
});
```


## Category: resource exhaustion

### Configure global query execution timeouts to prevent resource exhaustion

**Use when**

Developing database queries and operations that require protection against unbounded execution times and denial-of-service conditions.

**Secure rules**

**Rule 1: Set a global `maxTimeMS` timeout on all Mongoose queries to enforce execution limits.**

Configure `maxTimeMS` globally using `mongoose.set('maxTimeMS', ms)` to ensure that unoptimized aggregations or complex queries fail fast instead of consuming database CPU, memory, and connection slots indefinitely.

```javascript
const mongoose = require('mongoose');

// Attach maxTimeMS limit of 5 seconds to all queries
mongoose.set('maxTimeMS', 5000);
```


## Category: runtime environment hardening

### Disable command buffering to prevent runtime resource exhaustion on connection loss

**Use when**

Configuring database connections and handling connection failures during application startup and runtime.

**Secure rules**

**Rule 1: Set bufferCommands to false when creating connections to prevent hanging operations during database outages.**

Mongoose buffers database commands issued before a connection is established by default. When connection attempts fail or URIs are malformed, unhandled rejections can crash the process, while default command buffering during connection loss can cause requests to hang or fail unexpectedly. Always handle connection promises with catch/try-catch blocks and set bufferCommands to false if immediate failure during connection outages is preferred.

```javascript
const conn = mongoose.createConnection(uri, {
  bufferCommands: false
});

try {
  await conn.asPromise();
} catch (err) {
  console.error('Database connection failed:', err);
}
```


## Category: secret handling

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


## Category: security control integrity

### Enforce Schema Immutability and Prevent Bypass of Security Hooks

**Use when**

When configuring schema options, query update filters, and discriminator models to prevent unauthorized data modifications and control bypasses.

**Secure rules**

**Rule 1: Enforce strict mode to prevent unauthorized mutation of immutable fields.**

Keep strict mode enabled or set `{ strict: 'throw' }` in query update options to ensure immutable properties such as `immutable: true` fields cannot be altered.

```javascript
const userSchema = new Schema({
  ownerId: { type: String, immutable: true },
  role: String
});
const User = mongoose.model('User', userSchema);

await User.updateOne({ _id: id }, { role: 'admin', ownerId: 'newOwner' }, { strict: 'throw' });
```

**Rule 2: Enable schema validation explicitly for update operations**

Update validators are disabled by default. Set `runValidators: true` when using `updateOne()`, `updateMany()`, or `findOneAndUpdate()` to validate the update against the model's schema. Account for the documented limitations: update validators only validate updated paths and only run for supported update operators.

```javascript
const toySchema = new mongoose.Schema({
  color: String
});

toySchema.path('color').validate(
  value => /red|green|blue/i.test(value),
  'Invalid color'
);

const Toy = mongoose.model('Toy', toySchema);

await Toy.updateOne(
  {},
  { color: 'not a color' },
  { runValidators: true }
);
```


### Enforce Schema Validation and Lifecycle Middleware on Writes

**Use when**

When saving, updating, or performing batch writes on documents to prevent unvalidated data and ensure security middleware executes.

**Secure rules**

**Rule 1: Keep validateBeforeSave enabled when saving documents derived from untrusted input.**

Do not pass `validateBeforeSave: false` when calling `doc.save()`. Mongoose validates document properties against schema constraints before saving by default to prevent invalid or unvalidated data from reaching the database.

```javascript
const doc = await UserModel.findById(id);
doc.set(req.body);
await doc.save();
```

**Rule 2: Enable update validators globally and account for their limited scope**

Set `mongoose.set('runValidators', true)` to enable update validators by default. Update validators run only on paths included in the update and only for supported operators such as `$set`, `$unset`, `$push`, `$addToSet`, `$pull`, and `$pullAll`. They do not validate `$inc`, and required validators fail only when a path is explicitly `$unset`. Do not treat this setting as full-document validation.

```javascript
mongoose.set('runValidators', true);

const productSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['draft', 'published']
  }
});

const Product = mongoose.model('Product', productSchema);

await Product.updateOne(
  { status: 'draft' },
  { $set: { status: 'published' } }
);
```

**Rule 3: Use `create()` when every document must run `save()` middleware and validation**

`bulkWrite()` does not run per-document `save()` or `update()` middleware. When every inserted document must run `save()` middleware, use `Model.create()`, which saves each document individually and runs save validation by default. Although `bulkWrite()` validates `insertOne` and `replaceOne` operations unless `skipValidation` is enabled, that validation does not replace per-document save middleware.

```javascript
const characterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
});

const Character = mongoose.model('Character', characterSchema);

await Character.create([
  { name: 'Will Riker' },
  { name: 'Geordi LaForge' }
]);
```


### Maintain Session Isolation and State Integrity across Database Operations

**Use when**

When managing transactions, custom document states, and atomic query execution to ensure consistency and prevent state race conditions.

**Secure rules**

**Rule 1: Use doc.$locals for custom state transfer between middleware hooks.**

Store request context, user IDs, or temporary audit metadata in `doc.$locals` instead of setting custom top-level properties directly on document instances to avoid overwriting internal properties.

```javascript
schema.pre('save', function() {
  this.$locals.wasNew = this.isNew;
  this.$locals.updatedBy = currentSession.userId;
});
```

**Rule 2: Pass session options or enable AsyncLocalStorage for transaction isolation.**

Explicitly pass `{ session }` to every query and save call or set `mongoose.set('transactionAsyncLocalStorage', true)` to guarantee atomic transaction behavior.

```javascript
mongoose.set('transactionAsyncLocalStorage', true);

await mongoose.connection.transaction(async () => {
  await User.updateOne({ _id: userId }, { role: 'admin' });
  await AuditLog.create({ action: 'promote', userId });
});
```
