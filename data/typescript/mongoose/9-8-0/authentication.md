# Security cards

Repository: `https://github.com/automattic/mongoose#9.8.0`
Category: authentication

## authentication

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
