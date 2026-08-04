# Security cards

Repository: `https://github.com/automattic/mongoose#9.8.0`
Category: api contract misuse

## api contract misuse

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
