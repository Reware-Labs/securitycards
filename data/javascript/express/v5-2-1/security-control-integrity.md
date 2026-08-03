# Security cards

Repository: `https://github.com/expressjs/express#v5.2.1`
Documentation repository: `https://github.com/expressjs/expressjs.com#main`
Category: security control integrity

## security control integrity

### Mount Security Controls and Error Handlers Correctly in the Middleware Stack

**Use when**

Building and structuring the Express application middleware stack and defining error-handling routes.

**Secure rules**

**Rule 1: Delegate to the default error handler when headers are already sent.**

Always check `res.headersSent` in custom error-handling middleware before attempting to write or send an error response. If headers have already been transmitted, pass the error to `next(err)` so Express's default error handler can safely close the connection.

```javascript
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).render('error', { error: err });
});
```
