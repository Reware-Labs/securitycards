# Security cards

Repository: `https://github.com/jaredhanson/passport#v0.7.0`

## Category: access control

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


## Category: api contract misuse

### Configure Passport Authentication Options and Callbacks Correctly

**Use when**

Configuring `passport.authenticate()` options or invoking asynchronous login and logout methods where API contract compliance is required.

**Secure rules**

**Rule 1: Disable automatic `req.authInfo` when using `assignProperty` by setting `authInfo: false`**

In Passport v0.7.0, `authenticate()` populates **`req.authInfo` by default** when the `assignProperty` option is used. If that metadata should not be exposed to downstream middleware or API responses, pass `authInfo: false` alongside `assignProperty` to suppress the population of `req.authInfo`.

```javascript
app.post('/api/verify',
  passport.authenticate('bearer', {
    assignProperty: 'tokenDetails',
    authInfo: false          // prevent req.authInfo from being set
  }),
  (req, res) => {
    res.json({ tokenDetails: req.tokenDetails });
  }
);
```

**Rule 2: Provide a callback function to asynchronous login and logout methods**

Always pass a callback function as the final argument when invoking `req.login()` and `req.logout()` to ensure proper session handling and avoid unhandled exceptions.

```javascript
req.login(user, function(err) {
  if (err) {
    return next(err);
  }
  return res.redirect('/dashboard');
});

req.logout(function(err) {
  if (err) {
    return next(err);
  }
  return res.redirect('/login');
});
```


## Category: authentication

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


## Category: security control integrity

### Instantiate isolated Passport instances for distinct authentication contexts

**Use when**

When building applications that require isolated authentication contexts, such as multi-tenant systems or decoupled sub-applications running within the same process.

**Secure rules**

**Rule 1: Instantiate separate Passport instances using the Authenticator constructor instead of using the global default singleton.**

Prevent configuration leakage and cross-tenant authentication bypasses by instantiating separate Passport instances using `new Passport()` rather than modifying the global singleton state. Register strategies, user serialization rules, and middleware explicitly on each isolated instance.

```javascript
const { Passport } = require('passport');

const adminPassport = new Passport();
const userPassport = new Passport();

adminPassport.use('local', adminStrategy);
userPassport.use('local', userStrategy);

app.use('/admin', adminPassport.initialize());
app.use('/user', userPassport.initialize());
```


## Category: session management

### Prevent Session Fixation and Manage Session State Securely with Passport

**Use when**

Implementing user login and logout workflows that manage persistent authentication sessions using Passport.

**Secure rules**

**Rule 1: Enable `{ keepSessionInfo: true }` only after auditing pre-authentication session content**

`req.login()` regenerates and clears the session by default, protecting against session-fixation. Setting `{ keepSessionInfo: true }` overrides that defense by merging every key from the unauthenticated session into the new, authenticated session. Use the default behavior unless you have explicitly reviewed each item stored in the session and confirmed that it is safe and necessary to persist across the login boundary.

```javascript
// Default (safer): let Passport regenerate and clear the session
req.login(user, function (err) {
  if (err) { return next(err); }
  res.redirect('/dashboard');
});

// After auditing the session, you may opt-in to persistence
req.login(user, { keepSessionInfo: true }, function (err) {
  if (err) { return next(err); }
  res.redirect('/dashboard');
});
```
