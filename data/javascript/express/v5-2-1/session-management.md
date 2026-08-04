# Security cards

Repository: `https://github.com/expressjs/express#v5.2.1`
Documentation repository: `https://github.com/expressjs/expressjs.com#main`
Category: session management

## session management

### Regenerate session identifiers upon user authentication

**Use when**

Handling user authentication and privilege elevation events in Express session middleware.

**Secure rules**

**Rule 1: Regenerate the session identifier immediately upon successful user authentication.**

Invoke `req.session.regenerate()` when a user successfully authenticates before populating session credentials. This prevents session fixation attacks by ensuring session IDs are not reused across unauthenticated and authenticated states.

```javascript
app.post('/login', function (req, res, next) {
  if (!req.body) return res.sendStatus(400);
  authenticate(req.body.username, req.body.password, function (err, user) {
    if (err) return next(err);
    if (user) {
      req.session.regenerate(function (err) {
        if (err) return next(err);
        req.session.user = user;
        res.redirect('/restricted');
      });
    } else {
      res.redirect('/login');
    }
  });
});
```
