# Security cards

Repository: `https://github.com/automattic/mongoose#9.8.0`
Category: runtime environment hardening

## runtime environment hardening

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
