# Security cards

Repository: `https://github.com/automattic/mongoose#9.8.0`
Category: security control integrity

## security control integrity

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
