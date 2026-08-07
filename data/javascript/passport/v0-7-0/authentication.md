# Security cards

Repository: `https://github.com/jaredhanson/passport#v0.7.0`
Category: authentication

## authentication

### Configure Secure Authentication Routes and Custom Callbacks in Passport

**Use when**

Configuring standard authentication middleware routes or implementing custom callbacks with `passport.authenticate()`.

**Secure rules**

**Rule 1: Override strategy failure messages to prevent user enumeration.**

When configuring authentication routes with `passport.authenticate()`, override strategy-provided failure messages using `failureFlash` to present standardized generic error messages instead of raw strategy details.

```javascript
app.post('/login', passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Invalid credentials'
}));
```

**Rule 2: Explicitly handle false user objects and log in users in custom authentication callbacks.**

When using a custom callback with `passport.authenticate()`, Passport passes `false` as the second argument upon strategy authentication failure and does not automatically log in the user or establish a session. Application code must explicitly check if the user argument is `false` and terminate the request, or call `req.logIn()` to establish a session.

```javascript
app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/login'); }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/dashboard');
    });
  })(req, res, next);
});
```

**Rule 3: Verify user existence and active status in deserializeUser.**

In `passport.deserializeUser()`, when a user ID stored in a session no longer exists in the database or belongs to a disabled account, pass `done(null, false)` to the callback rather than returning a user object or throwing an unhandled exception.

```javascript
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    if (err) { return done(err); }
    if (!user || user.isDisabled) {
      return done(null, false);
    }
    return done(null, user);
  });
});
```
