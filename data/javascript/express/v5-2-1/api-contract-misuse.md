# Security cards

Repository: `https://github.com/expressjs/express#v5.2.1`
Documentation repository: `https://github.com/expressjs/expressjs.com#main`
Category: api contract misuse

## api contract misuse

### Use correct Express 5 argument signatures and error-handling patterns for middleware and routes

**Use when**

Implementing request handlers, middleware functions, and routing logic in Express 5 applications.

**Secure rules**

**Rule 1: Await asynchronous operations before calling `next()` in middleware and allow Express 5 to automatically forward rejected promises.**

Ensure asynchronous validation or authentication checks are fully awaited before invoking `next()` in custom middleware. In Express 5, rejections in async middleware and route handlers are automatically forwarded to global error-handling middleware without requiring explicit try/catch blocks for promise rejections.

```javascript
async function validateCookies(req, res, next) {
  await cookieValidator(req.cookies);
  next();
}

app.use(validateCookies);

app.use((err, req, res, next) => {
  res.status(400).send('Invalid request');
});
```

**Rule 2: Mount error handling middleware after all application routes and standard middleware.**

Register error handling middleware functions with four arguments (`err`, `req`, `res`, `next`) only after all route handlers and standard middleware are mounted so errors are properly caught.

```javascript
app.get('/', (req, res) => {
  res.send('OK');
});

app.use((err, req, res, next) => {
  res.status(500).send('An unexpected error occurred');
});
```

**Rule 3: Use the status-first argument signature when calling `res.redirect()`.**

Provide the numeric status code as the first argument and the target URL as the second argument when invoking `res.redirect()` to match Express 5 signature requirements.

```javascript
app.get('/old-route', function (req, res) {
  res.redirect(301, '/new-route');
});
```

**Rule 4: Explicitly catch and forward errors thrown inside detached asynchronous callbacks to `next()`.**

Wrap non-Promise asynchronous callbacks such as `setTimeout` handlers in `try...catch` blocks and pass any caught exceptions directly to `next(err)` to prevent unhandled process crashes.

```javascript
app.get('/async-task', (req, res, next) => {
  setTimeout(() => {
    try {
      throw new Error('Asynchronous failure');
    } catch (err) {
      next(err);
    }
  }, 100);
});
```

**Rule 5: Validate that middleware handlers passed to `app.use()` are valid functions.**

Verify that middleware imports and components are valid functions before passing them to `app.use()` to prevent synchronous `TypeError` exceptions during application startup.

```javascript
const authMiddleware = require('./middleware/auth');

if (typeof authMiddleware === 'function') {
  app.use('/protected', authMiddleware);
} else {
  throw new TypeError('Expected auth middleware to be a function');
}
```

**Rule 6: Append additional cookies instead of replacing the `Set-Cookie` header**

Use `res.cookie()` to create cookies and `res.append('Set-Cookie', value)` when adding a raw cookie header after another middleware has already set cookies. Do not call `res.set('Set-Cookie', value)` afterward, because it resets the existing `Set-Cookie` values.

```javascript
const express = require('express');
const app = express();

app.use((req, res, next) => {
  res.cookie('session', 'secret-session-id', {
    httpOnly: true,
    secure: true
  });
  next();
});

app.get('/', (req, res) => {
  res.append('Set-Cookie', 'theme=dark; Path=/');
  res.send('OK');
});
```
