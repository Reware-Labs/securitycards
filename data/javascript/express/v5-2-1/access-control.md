# Security cards

Repository: `https://github.com/expressjs/express#v5.2.1`
Documentation repository: `https://github.com/expressjs/expressjs.com#main`
Category: access control

## access control

### Chain authorization middleware to enforce ownership and role checks

**Use when**

Developing route handlers that require role checks, ownership verifications, or tenant constraints before executing business logic.

**Secure rules**

**Rule 1: Compose permission middleware sequentially in route definitions**

Attach authorization middleware directly to protected route definitions before the final handler. Middleware should call `next()` only when processing may continue and pass an error to `next()` when access is denied.

```javascript
function andRestrictToSelf(req, res, next) {
  if (req.authenticatedUser.id === req.user.id) {
    return next();
  }

  next(new Error('Unauthorized'));
}

function andRestrictTo(role) {
  return function (req, res, next) {
    if (req.authenticatedUser.role === role) {
      return next();
    }

    next(new Error('Unauthorized'));
  };
}

app.get('/user/:id/edit', loadUser, andRestrictToSelf, function (req, res) {
  res.send('Editing user ' + req.user.name);
});

app.delete('/user/:id', loadUser, andRestrictTo('admin'), function (req, res) {
  res.send('Deleted user ' + req.user.name);
});
```

**Rule 2: Enforce authentication and permission checks on all protected routes.**

Verify valid session states and permissions before granting access to restricted resources, redirecting or blocking unauthenticated clients appropriately.

```javascript
function restrict(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login');
}

app.get('/restricted', restrict, function (req, res) {
  res.send('Welcome to the protected area');
});
```

**Rule 3: Apply access control checks across all HTTP methods using app.all.**

Use `app.all()` or `app.use()` when attaching authorization middleware to route paths so that all HTTP request methods are guarded consistently without leaving endpoints vulnerable.

```javascript
app.all('/secret/*', (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).send('Access denied');
  }
  next();
});
```
