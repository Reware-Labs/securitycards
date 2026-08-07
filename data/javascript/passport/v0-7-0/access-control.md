# Security cards

Repository: `https://github.com/jaredhanson/passport#v0.7.0`
Category: access control

## access control

### Enforce explicit access control and authorization checks for requests passing through authentication middleware

**Use when**

Implementing protected routes or dashboard endpoints where authentication strategies may pass execution or permit unauthenticated requests to proceed down the middleware stack.

**Secure rules**

**Rule 1: Protect routes that require login by checking `req.isAuthenticated()`**

Passport’s *session* strategy restores login state but allows unauthenticated requests to flow through the middleware stack. To keep sensitive endpoints secure, insert a guard that verifies `req.isAuthenticated()` (or the presence of `req.user`) before the route logic runs.

```javascript
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {      // user restored to the request
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

// Apply the guard to any route that needs an authenticated user
app.get('/account', ensureAuthenticated, (req, res) => {
  res.json({ email: req.user.email });
});
```
