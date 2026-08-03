# Security cards

Repository: `https://github.com/expressjs/express#v5.2.1`
Documentation repository: `https://github.com/expressjs/expressjs.com#main`
Category: boundary control

## boundary control

### Inspect req.originalUrl for Path-Based Security Checks in Mounted Middleware

**Use when**

When implementing authorization checks, security logging, or boundary access controls inside middleware or sub-applications mounted with prefix paths using `app.use()`.

**Secure rules**

**Rule 1: Inspect req.originalUrl instead of req.url within mounted middleware to correctly evaluate complete request paths for security boundaries.**

Because Express rewrites `req.url` inside mounted sub-routers to be relative to the prefix, security checks relying on `req.url` can be bypassed. Use `req.originalUrl` to evaluate the actual full path against security rules.

```javascript
app.use('/api', function (req, res, next) {
  // Access full original request URL for path checks
  if (req.originalUrl.startsWith('/api/admin') && !req.user?.isAdmin) {
    return res.status(403).send('Forbidden');
  }
  next();
});
```
